import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
import { format, isToday, isYesterday } from 'date-fns';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get unread notifications for the user
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Get upcoming visits that need attention
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const upcomingVisits = await prisma.visit.findMany({
      where: {
        organizationId: session.user.organizationId,
        startTime: {
          gte: now,
          lte: tomorrow,
        },
        status: 'SCHEDULED',
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        staff: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: 3,
    });

    // Get completed invoices awaiting payment
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        organizationId: session.user.organizationId,
        status: 'OVERDUE',
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 2,
    });

    // Combine and format alerts
    const alerts = [];

    // Add notifications
    notifications.forEach(notification => {
      alerts.push({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        createdAt: format(notification.createdAt, 'h:mm a'),
        isRecent: isToday(notification.createdAt) || isYesterday(notification.createdAt),
      });
    });

    // Add upcoming visit reminders
    upcomingVisits.forEach(visit => {
      const timeLabel = isToday(visit.startTime)
        ? `Today at ${format(visit.startTime, 'h:mm a')}`
        : `Tomorrow at ${format(visit.startTime, 'h:mm a')}`;

      alerts.push({
        id: `visit-${visit.id}`,
        type: 'visit',
        title: 'Upcoming Visit',
        message: `${visit.client.firstName} ${visit.client.lastName} - ${timeLabel}`,
        createdAt: format(visit.startTime, 'h:mm a'),
        isRecent: true,
        visitId: visit.id,
      });
    });

    // Add overdue invoice alerts
    overdueInvoices.forEach(invoice => {
      alerts.push({
        id: `invoice-${invoice.id}`,
        type: 'invoice',
        title: 'Overdue Invoice',
        message: `${invoice.client.firstName} ${invoice.client.lastName} - $${invoice.amount.toFixed(2)} due on ${format(invoice.dueDate, 'MMM d')}`,
        createdAt: format(invoice.dueDate, 'MMM d'),
        isRecent: true,
        invoiceId: invoice.id,
      });
    });

    // Sort by creation date and take top 5
    alerts.sort((a, b) => {
      if (a.isRecent && !b.isRecent) return -1;
      if (!a.isRecent && b.isRecent) return 1;
      return 0;
    });

    return NextResponse.json({ alerts: alerts.slice(0, 5) });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}
