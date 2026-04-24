import prisma from '@/lib/prisma';
import { format, isToday, isYesterday, subMonths } from 'date-fns';

function toMoney(value) {
  return Number.isFinite(value) ? value : 0;
}

function formatKpi(value, change = '0%', changeType = 'neutral') {
  return { value, change, changeType };
}

export async function getDashboardSummary(organizationId, userId = null) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 6);
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    totalClients,
    activeStaff,
    scheduledVisitsToday,
    revenueThisMonth,
    weeklyVisits,
    recentInvoices,
    upcomingShiftVisits,
    notifications,
    alertVisits,
    overdueInvoices,
    evvVisits,
    yearInvoices,
  ] = await Promise.all([
    prisma.client.count({ where: { organizationId, status: { in: ['ACTIVE', 'PENDING', 'ON_HOLD'] } } }),
    prisma.staff.count({ where: { organizationId, status: 'ACTIVE' } }),
    prisma.visit.count({
      where: {
        organizationId,
        status: { in: ['SCHEDULED', 'OFFERED', 'IN_PROGRESS', 'CLOCKED_IN', 'VACANT'] },
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
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        startTime: { gte: now },
      },
      orderBy: { startTime: 'asc' },
      take: 5,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        client: { select: { firstName: true, lastName: true, address: true, city: true } },
        staff: { select: { firstName: true, lastName: true } },
        carePlan: { select: { name: true } },
      },
    }),
    userId
      ? prisma.notification.findMany({
          where: {
            userId,
            read: false,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        })
      : Promise.resolve([]),
    prisma.visit.findMany({
      where: {
        organizationId,
        startTime: {
          gte: now,
          lte: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        },
        status: 'SCHEDULED',
      },
      select: {
        id: true,
        startTime: true,
        client: { select: { firstName: true, lastName: true } },
      },
      orderBy: { startTime: 'asc' },
      take: 3,
    }),
    prisma.invoice.findMany({
      where: {
        organizationId,
        status: 'OVERDUE',
      },
      select: {
        id: true,
        amount: true,
        dueDate: true,
        client: { select: { firstName: true, lastName: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 2,
    }),
    prisma.visit.findMany({
      where: {
        organizationId,
        status: { in: ['MISSED', 'LATE', 'NO_SHOW'] },
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
      },
      select: {
        actualStart: true,
        actualEnd: true,
      },
    }),
    prisma.invoice.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(now.getFullYear(), 0, 1),
        },
      },
      select: {
        amount: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const visitsByDay = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    const dayVisits = weeklyVisits.filter((visit) => visit.startTime >= date && visit.startTime < nextDay);

    return {
      date: format(date, 'MMM d'),
      scheduled: dayVisits.filter((visit) => visit.status === 'SCHEDULED').length,
      completed: dayVisits.filter((visit) => visit.status === 'COMPLETED').length,
    };
  });

  const verifiedVisits = evvVisits.filter((visit) => visit.actualStart && visit.actualEnd).length;
  const evvTotal = evvVisits.length;
  const revenueChartData = Array.from({ length: 6 }, (_, offset) => {
    const monthDate = subMonths(now, 5 - offset);
    const monthInvoices = yearInvoices.filter(
      (invoice) =>
        invoice.createdAt.getFullYear() === monthDate.getFullYear() &&
        invoice.createdAt.getMonth() === monthDate.getMonth()
    );
    const monthLabel = format(monthDate, 'MMM yyyy');

    return {
      month: monthLabel,
      paid: monthInvoices
        .filter((invoice) => ['PAID', 'PARTIALLY_PAID'].includes(invoice.status))
        .reduce((sum, invoice) => sum + invoice.amount, 0),
      pending: monthInvoices
        .filter((invoice) => ['DRAFT', 'SENT', 'OVERDUE'].includes(invoice.status))
        .reduce((sum, invoice) => sum + invoice.amount, 0),
    };
  });

  const formattedRecentInvoices = recentInvoices.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    clientName: `${invoice.client.firstName} ${invoice.client.lastName}`,
    amount: invoice.amount,
    formattedAmount: `$${invoice.amount.toFixed(2)}`,
    dueDate: format(invoice.dueDate, 'MMM d, yyyy'),
    status: invoice.status,
    createdAt: format(invoice.createdAt, 'MMM d, yyyy'),
  }));

  const formattedUpcomingShifts = upcomingShiftVisits.map((visit) => ({
    id: visit.id,
    clientName: visit.client ? `${visit.client.firstName} ${visit.client.lastName}` : 'Unknown Client',
    clientAddress: visit.client
      ? `${visit.client.address || 'N/A'}${visit.client.city ? `, ${visit.client.city}` : ''}`
      : 'N/A',
    staffName: visit.staff ? `${visit.staff.firstName} ${visit.staff.lastName}` : 'Unassigned',
    carePlan: visit.carePlan?.name || 'N/A',
    startTime: format(visit.startTime, 'MMM d, yyyy h:mm a'),
    endTime: format(visit.endTime, 'h:mm a'),
    status: visit.status,
  }));

  const formattedAlerts = [];
  notifications.forEach((notification) => {
    formattedAlerts.push({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      createdAt: format(notification.createdAt, 'h:mm a'),
      isRecent: isToday(notification.createdAt) || isYesterday(notification.createdAt),
    });
  });

  alertVisits.forEach((visit) => {
    const timeLabel = isToday(visit.startTime)
      ? `Today at ${format(visit.startTime, 'h:mm a')}`
      : `Tomorrow at ${format(visit.startTime, 'h:mm a')}`;

    formattedAlerts.push({
      id: `visit-${visit.id}`,
      type: 'visit',
      title: 'Upcoming Visit',
      message: `${visit.client.firstName} ${visit.client.lastName} - ${timeLabel}`,
      createdAt: format(visit.startTime, 'h:mm a'),
      isRecent: true,
      visitId: visit.id,
    });
  });

  overdueInvoices.forEach((invoice) => {
    formattedAlerts.push({
      id: `invoice-${invoice.id}`,
      type: 'invoice',
      title: 'Overdue Invoice',
      message: `${invoice.client.firstName} ${invoice.client.lastName} - $${invoice.amount.toFixed(2)} due on ${format(invoice.dueDate, 'MMM d')}`,
      createdAt: format(invoice.dueDate, 'MMM d'),
      isRecent: true,
      invoiceId: invoice.id,
    });
  });

  formattedAlerts.sort((a, b) => {
    if (a.isRecent && !b.isRecent) return -1;
    if (!a.isRecent && b.isRecent) return 1;
    return 0;
  });

  return {
    metrics: {
      totalClients: formatKpi(String(totalClients)),
      activeStaff: formatKpi(String(activeStaff)),
      scheduledVisitsToday: formatKpi(String(scheduledVisitsToday)),
      revenueThisMonth: formatKpi(`$${toMoney(revenueThisMonth._sum.amount).toFixed(2)}`),
    },
    visitChart: { data: visitsByDay },
    revenueChart: { data: revenueChartData },
    upcomingShifts: formattedUpcomingShifts,
    recentInvoices: formattedRecentInvoices,
    alerts: formattedAlerts.slice(0, 5),
    evv: {
      verified: verifiedVisits,
      unverified: evvTotal - verifiedVisits,
      rate: evvTotal > 0 ? Math.round((verifiedVisits / evvTotal) * 100) : 0,
    },
  };
}
