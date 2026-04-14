import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where = {
      organizationId: session.user.organizationId,
    };

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const counts = await prisma.visit.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    // Create a map of status counts
    const statusCounts = {};
    const allStatuses = ['SCHEDULED', 'VACANT', 'OFFERED', 'IN_PROGRESS', 'CLOCKED_IN', 'COMPLETED', 'APPROVED', 'CANCELLED', 'ON_HOLD', 'NO_SHOW', 'MISSED', 'LATE'];

    // Initialize all statuses to 0
    allStatuses.forEach(status => {
      statusCounts[status] = 0;
    });

    // Update with actual counts
    counts.forEach(count => {
      statusCounts[count.status] = count._count;
    });

    return NextResponse.json(statusCounts);
  } catch (error) {
    console.error('Error fetching status counts:', error);
    return NextResponse.json({ error: 'Failed to fetch status counts' }, { status: 500 });
  }
}
