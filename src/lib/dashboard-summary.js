import prisma from '@/lib/prisma';
import { buildEvvSummary, buildWeeklyVisitChartData } from './dashboard-summary.helpers.js';

function toMoney(value) {
  return Number.isFinite(value) ? value : 0;
}

function formatKpi(value, change = '0%', changeType = 'neutral') {
  return { value, change, changeType };
}

export async function getDashboardSummary(organizationId) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 6);
  startOfWeek.setHours(0, 0, 0, 0);

  const [totalClients, activeStaff, scheduledVisitsToday, revenueThisMonth, weeklyVisits, recentInvoices, upcomingShifts, alerts, evvVisits] = await Promise.all([
    prisma.client.count({ where: { organizationId, status: { in: ['ACTIVE', 'PENDING', 'ON_HOLD'] } } }),
    prisma.staff.count({ where: { organizationId, status: 'ACTIVE' } }),
    prisma.visit.count({
      where: {
        organizationId,
        status: { in: ['SCHEDULED', 'OFFERED', 'IN_PROGRESS', 'CLOCKED_IN'] },
        startTime: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
      },
    }),
    prisma.invoice.aggregate({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
        },
        status: { in: ['PAID', 'PARTIALLY_PAID', 'SENT', 'OVERDUE'] },
      },
      _sum: { amount: true },
    }),
    prisma.visit.findMany({
      where: {
        organizationId,
        startTime: { gte: startOfWeek },
        status: { in: ['SCHEDULED', 'OFFERED', 'IN_PROGRESS', 'CLOCKED_IN', 'COMPLETED', 'APPROVED'] },
      },
      select: { startTime: true, status: true },
      orderBy: { startTime: 'asc' },
    }),
    prisma.invoice.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        amount: true,
        status: true,
        dueDate: true,
        client: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.visit.findMany({
      where: {
        organizationId,
        status: { in: ['SCHEDULED', 'OFFERED', 'IN_PROGRESS', 'CLOCKED_IN'] },
        startTime: { gte: now },
      },
      orderBy: { startTime: 'asc' },
      take: 5,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        client: { select: { firstName: true, lastName: true } },
        staff: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.visit.findMany({
      where: {
        organizationId,
        status: { in: ['SCHEDULED', 'OFFERED', 'IN_PROGRESS', 'CLOCKED_IN', 'COMPLETED', 'APPROVED'] },
        startTime: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
      },
      orderBy: { startTime: 'desc' },
      take: 5,
      select: {
        id: true,
        startTime: true,
        status: true,
        client: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.visit.findMany({
      where: {
        organizationId,
        startTime: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
        status: { in: ['SCHEDULED', 'OFFERED', 'IN_PROGRESS', 'CLOCKED_IN', 'COMPLETED', 'APPROVED'] },
      },
      select: {
        actualStart: true,
        actualEnd: true,
      },
    }),
  ]);

  const visitsByDay = buildWeeklyVisitChartData(weeklyVisits, startOfWeek);
  const evv = buildEvvSummary(evvVisits);

  return {
    metrics: {
      totalClients: formatKpi(String(totalClients)),
      activeStaff: formatKpi(String(activeStaff)),
      scheduledVisitsToday: formatKpi(String(scheduledVisitsToday)),
      // Revenue currently follows invoice creation time because the schema has no explicit billing-period field yet.
      revenueThisMonth: formatKpi(`$${toMoney(revenueThisMonth._sum.amount).toFixed(2)}`),
    },
    visitChart: { data: visitsByDay },
    revenueChart: { data: [] },
    upcomingShifts,
    recentInvoices,
    alerts,
    evv,
  };
}
