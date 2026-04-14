import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
import { format } from 'date-fns';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Get next 5 upcoming visits
    const upcomingVisits = await prisma.visit.findMany({
      where: {
        organizationId: session.user.organizationId,
        startTime: {
          gte: now,
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS'],
        },
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            address: true,
            city: true,
            phone: true,
          },
        },
        staff: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        carePlan: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      take: 5,
    });

    const shifts = upcomingVisits.map(visit => ({
      id: visit.id,
      clientName: visit.client ? `${visit.client.firstName} ${visit.client.lastName}` : 'Unknown Client',
      clientAddress: visit.client ? `${visit.client.address}, ${visit.client.city}` : 'N/A',
      staffName: visit.staff ? `${visit.staff.firstName} ${visit.staff.lastName}` : 'Unassigned',
      carePlan: visit.carePlan?.name || 'N/A',
      startTime: format(visit.startTime, 'MMM d, yyyy h:mm a'),
      endTime: format(visit.endTime, 'h:mm a'),
      status: visit.status,
    }));

    return NextResponse.json({ shifts });
  } catch (error) {
    console.error('Error fetching upcoming shifts:', error);
    return NextResponse.json({ error: 'Failed to fetch upcoming shifts' }, { status: 500 });
  }
}
