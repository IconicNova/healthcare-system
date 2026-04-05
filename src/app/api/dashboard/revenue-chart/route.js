import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { subMonths, format, startOfMonth } from 'date-fns';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const sixMonthsAgo = subMonths(now, 6);

    // Get invoices for the last 6 months
    const invoices = await prisma.invoice.findMany({
      where: {
        organizationId: session.user.organizationId,
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        amount: true,
        createdAt: true,
        status: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group invoices by month
    const monthlyRevenue = {};
    const monthLabels = [];

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthStart = startOfMonth(date);
      const nextMonthStart = startOfMonth(subMonths(date, -1));

      const label = format(date, 'MMM yyyy');
      monthLabels.push(label);

      monthlyRevenue[label] = {
        total: 0,
        paid: 0,
        pending: 0,
      };
    }

    invoices.forEach(invoice => {
      const invoiceMonth = format(invoice.createdAt, 'MMM yyyy');
      if (monthlyRevenue[invoiceMonth]) {
        monthlyRevenue[invoiceMonth].total += invoice.amount;
        if (invoice.status === 'PAID') {
          monthlyRevenue[invoiceMonth].paid += invoice.amount;
        } else {
          monthlyRevenue[invoiceMonth].pending += invoice.amount;
        }
      }
    });

    const chartData = monthLabels.map(label => ({
      month: label,
      total: monthlyRevenue[label].total,
      paid: monthlyRevenue[label].paid,
      pending: monthlyRevenue[label].pending,
    }));

    return NextResponse.json({
      labels: monthLabels,
      data: chartData,
    });
  } catch (error) {
    console.error('Error fetching revenue chart data:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue chart data' }, { status: 500 });
  }
}
