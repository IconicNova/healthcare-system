import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO } from 'date-fns';
import { serializeApiValue } from '@/lib/serialization';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom') || format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const dateTo = searchParams.get('dateTo') || format(endOfMonth(new Date()), 'yyyy-MM-dd');

    const fromDate = parseISO(dateFrom);
    const toDate = parseISO(dateTo);

    // Get invoices within date range
    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId: session.user.organizationId,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        invoiceItems: {
          include: {
            service: true,
            visit: {
              include: {
                client: true,
              },
            },
          },
        },
        client: true,
        payments: true,
      },
    });

    // Calculate daily revenue
    const dailyRevenue = {};
    const days = eachDayOfInterval({ start: fromDate, end: toDate });
    days.forEach(day => {
      dailyRevenue[format(day, 'yyyy-MM-dd')] = 0;
    });

    invoices.forEach(invoice => {
      const invoiceDate = format(new Date(invoice.createdAt), 'yyyy-MM-dd');
      if (dailyRevenue[invoiceDate] !== undefined) {
        dailyRevenue[invoiceDate] += Number(invoice.amount);
      }
    });

    const revenueData = days.map(day => ({
      date: format(day, 'MMM d'),
      fullDate: format(day, 'yyyy-MM-dd'),
      revenue: dailyRevenue[format(day, 'yyyy-MM-dd')],
    }));

    // Calculate total revenue
    const totalRevenue = invoices
      .filter(inv => inv.status !== 'CANCELLED')
      .reduce((sum, inv) => sum + Number(inv.amount), 0);

    // Calculate total expenses from payroll (timesheets)
    const timesheets = await prisma.timesheet.findMany({
      where: {
        organizationId: session.user.organizationId,
        startDate: {
          gte: fromDate,
          lte: toDate,
        },
        status: { in: ['APPROVED', 'PAID'] },
      },
      include: {
        staff: true,
      },
    });

    // Get staff hourly rates
    const staffRates = {};
    timesheets.forEach(ts => {
      if (ts.staff && !staffRates[ts.staffId]) {
        staffRates[ts.staffId] = Number(ts.staff.hourlyRate || 0);
      }
    });

    const totalExpenses = timesheets.reduce((sum, ts) => {
      const rate = staffRates[ts.staffId] || 0;
      return sum + (Number(ts.totalHours) * rate);
    }, 0);

    const netProfit = totalRevenue - totalExpenses;

    // Service breakdown
    const serviceBreakdown = {};
    invoices.forEach(invoice => {
      invoice.invoiceItems.forEach(item => {
        if (item.service) {
          if (!serviceBreakdown[item.service.name]) {
            serviceBreakdown[item.service.name] = {
              service: item.service.name,
              visits: new Set(),
              hours: 0,
              revenue: 0,
            };
          }
          if (item.visit) {
            serviceBreakdown[item.service.name].visits.add(item.visit.id);
            // Calculate hours from visit duration
            if (item.visit.startTime && item.visit.endTime) {
              const duration = (new Date(item.visit.endTime) - new Date(item.visit.startTime)) / (1000 * 60 * 60);
              serviceBreakdown[item.service.name].hours += duration;
            }
          }
          serviceBreakdown[item.service.name].revenue += Number(item.amount);
        }
      });
    });

    const serviceBreakdownArray = Object.values(serviceBreakdown).map(sb => ({
      ...sb,
      visits: sb.visits.size,
      hours: parseFloat(sb.hours.toFixed(2)),
      revenue: parseFloat(sb.revenue.toFixed(2)),
      percentage: totalRevenue > 0 ? ((sb.revenue / totalRevenue) * 100).toFixed(1) : 0,
    }));

    // Invoice aging report
    const now = new Date();
    const agingBuckets = {
      current: { count: 0, total: 0 },
      '1-30': { count: 0, total: 0 },
      '31-60': { count: 0, total: 0 },
      '61-90': { count: 0, total: 0 },
      '90+': { count: 0, total: 0 },
    };

    invoices
      .filter(inv => inv.status === 'SENT' || inv.status === 'OVERDUE' || inv.status === 'PARTIALLY_PAID')
      .forEach(invoice => {
        const dueDate = new Date(invoice.dueDate);
        const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
        const outstanding = Number(invoice.amount) - invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);

        if (daysOverdue < 0) {
          agingBuckets.current.count++;
          agingBuckets.current.total += outstanding;
        } else if (daysOverdue <= 30) {
          agingBuckets['1-30'].count++;
          agingBuckets['1-30'].total += outstanding;
        } else if (daysOverdue <= 60) {
          agingBuckets['31-60'].count++;
          agingBuckets['31-60'].total += outstanding;
        } else if (daysOverdue <= 90) {
          agingBuckets['61-90'].count++;
          agingBuckets['61-90'].total += outstanding;
        } else {
          agingBuckets['90+'].count++;
          agingBuckets['90+'].total += outstanding;
        }
      });

    const agingData = [
      { bucket: 'Current', count: agingBuckets.current.count, total: agingBuckets.current.total },
      { bucket: '1-30 days', count: agingBuckets['1-30'].count, total: agingBuckets['1-30'].total },
      { bucket: '31-60 days', count: agingBuckets['31-60'].count, total: agingBuckets['31-60'].total },
      { bucket: '61-90 days', count: agingBuckets['61-90'].count, total: agingBuckets['61-90'].total },
      { bucket: '90+ days', count: agingBuckets['90+'].count, total: agingBuckets['90+'].total },
    ];

    return NextResponse.json(serializeApiValue({
      revenueData,
      summary: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        netProfit: parseFloat(netProfit.toFixed(2)),
      },
      serviceBreakdown: serviceBreakdownArray,
      agingData,
      dateFrom,
      dateTo,
    }));
  } catch (error) {
    console.error('Error fetching financial report:', error);
    return NextResponse.json({ error: 'Failed to fetch financial report' }, { status: 500 });
  }
}
