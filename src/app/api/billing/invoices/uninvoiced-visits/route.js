import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
import { hasRoleAccess } from '@/lib/utils';

// GET - Get completed visits that haven't been invoiced yet
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC - only ADMIN, MANAGER, SUPERVISOR can access billing
    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER', 'SUPERVISOR'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const organizationId = session.user.organizationId;

    // Build where clause
    const where = {
      organizationId,
      status: { in: ['COMPLETED', 'APPROVED'] },
      invoiceItems: { none: {} }, // Not yet invoiced (no invoice items associated)
    };

    // Add client filter if provided
    if (clientId) {
      where.clientId = clientId;
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
    }

    const visits = await prisma.visit.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        service: {
          select: {
            name: true,
            baseRate: true,
            duration: true,
          },
        },
        staff: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Format visits with calculated hours
    const formattedVisits = visits.map((visit) => {
      let hours = 0;

      // Priority 1: Use actual times if both available
      if (visit.actualStart && visit.actualEnd) {
        const start = new Date(visit.actualStart);
        const end = new Date(visit.actualEnd);
        hours = (end - start) / (1000 * 60 * 60); // Convert ms to hours
      } else if (visit.startTime && visit.endTime) {
        // Priority 2: Use scheduled times if both available
        const start = new Date(visit.startTime);
        const end = new Date(visit.endTime);
        hours = (end - start) / (1000 * 60 * 60);
      } else if (visit.service?.duration) {
        // Priority 3: Use service duration if available
        hours = visit.service.duration / 60; // Convert minutes to hours
      }

      const rate = visit.service?.baseRate || 0;
      const amount = hours * rate;

      return {
        id: visit.id,
        date: visit.startTime.toISOString().split('T')[0],
        actualStart: visit.actualStart?.toISOString(),
        actualEnd: visit.actualEnd?.toISOString(),
        serviceName: visit.service?.name || 'Unknown Service',
        hours: parseFloat(hours.toFixed(2)),
        rate: rate,
        amount: parseFloat(amount.toFixed(2)),
        client: {
          id: visit.client.id,
          name: `${visit.client.firstName} ${visit.client.lastName}`,
        },
        staffName: visit.staff ? `${visit.staff.firstName} ${visit.staff.lastName}` : null,
        notes: visit.notes,
      };
    });

    // Group by client
    const groupedByClient = formattedVisits.reduce((acc, visit) => {
      if (!acc[visit.client.id]) {
        acc[visit.client.id] = {
          clientId: visit.client.id,
          clientName: visit.client.name,
          visits: [],
          totalHours: 0,
          totalAmount: 0,
        };
      }
      acc[visit.client.id].visits.push(visit);
      acc[visit.client.id].totalHours += visit.hours;
      acc[visit.client.id].totalAmount += visit.amount;
      return acc;
    }, {});

    return NextResponse.json({
      visits: formattedVisits,
      groupedByClient: Object.values(groupedByClient),
    });
  } catch (error) {
    console.error('Error fetching uninvoiced visits:', error);
    return NextResponse.json({ error: 'Failed to fetch uninvoiced visits' }, { status: 500 });
  }
}
