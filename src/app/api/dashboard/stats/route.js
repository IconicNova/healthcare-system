import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { subDays, startOfMonth } from 'date-fns';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const monthStart = startOfMonth(now);
    const previousMonthStart = subDays(monthStart, 30);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);
    const yesterday = subDays(todayStart, 1);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);
    const activeVisitStatuses = ['SCHEDULED', 'IN_PROGRESS', 'CLOCKED_IN', 'OFFERED', 'VACANT'];

    // Run all independent queries in parallel for performance
    const [
      totalClients,
      previousClients,
      activeStaff,
      previousStaff,
      scheduledVisitsToday,
      scheduledVisitsYesterday,
      currentMonthRevenue,
      previousMonthRevenue,
    ] = await Promise.all([
      // Total active clients
      prisma.client.count({
        where: {
          organizationId: session.user.organizationId,
          status: 'ACTIVE',
        },
      }),
      // Previous month clients for comparison
      prisma.client.count({
        where: {
          organizationId: session.user.organizationId,
          status: 'ACTIVE',
          createdAt: { lt: thirtyDaysAgo },
        },
      }),
      // Active staff count
      prisma.staff.count({
        where: {
          organizationId: session.user.organizationId,
          status: 'ACTIVE',
        },
      }),
      // Previous month staff for comparison
      prisma.staff.count({
        where: {
          organizationId: session.user.organizationId,
          status: 'ACTIVE',
          createdAt: { lt: thirtyDaysAgo },
        },
      }),
      // Scheduled visits today
      prisma.visit.count({
        where: {
          organizationId: session.user.organizationId,
          status: { in: activeVisitStatuses },
          startTime: { gte: todayStart, lte: todayEnd },
        },
      }),
      // Yesterday's visits for comparison
      prisma.visit.count({
        where: {
          organizationId: session.user.organizationId,
          status: { in: activeVisitStatuses },
          startTime: { gte: yesterday, lte: yesterdayEnd },
        },
      }),
      // Current month revenue
      prisma.invoice.aggregate({
        where: {
          organizationId: session.user.organizationId,
          status: { in: ['PAID', 'SENT'] },
          createdAt: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      // Previous month revenue
      prisma.invoice.aggregate({
        where: {
          organizationId: session.user.organizationId,
          status: { in: ['PAID', 'SENT'] },
          createdAt: { gte: previousMonthStart, lt: monthStart },
        },
        _sum: { amount: true },
      }),
    ]);

    const clientChange = previousClients > 0
      ? ((totalClients - previousClients) / previousClients * 100).toFixed(1)
      : 0;
    const staffChange = previousStaff > 0
      ? ((activeStaff - previousStaff) / previousStaff * 100).toFixed(1)
      : 0;
    const visitsChange = scheduledVisitsYesterday > 0
      ? ((scheduledVisitsToday - scheduledVisitsYesterday) / scheduledVisitsYesterday * 100).toFixed(1)
      : 0;
    const currentRevenue = currentMonthRevenue._sum.amount || 0;
    const previousRevenue = previousMonthRevenue._sum.amount || 0;
    const revenueChange = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : 0;

    return NextResponse.json({
      totalClients: {
        value: totalClients,
        change: `${Math.abs(clientChange)}%`,
        changeType: clientChange >= 0 ? 'positive' : 'negative',
      },
      activeStaff: {
        value: activeStaff,
        change: `${Math.abs(staffChange)}%`,
        changeType: staffChange >= 0 ? 'positive' : 'negative',
      },
      scheduledVisitsToday: {
        value: scheduledVisitsToday,
        change: `${Math.abs(visitsChange)}%`,
        changeType: visitsChange >= 0 ? 'positive' : 'negative',
      },
      revenueThisMonth: {
        value: `$${currentRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `${Math.abs(revenueChange)}%`,
        changeType: revenueChange >= 0 ? 'positive' : 'negative',
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
