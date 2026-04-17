import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ALL_SCHEDULING_STATUSES } from '@/lib/scheduling';

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
    const staffId = searchParams.get('staffId');
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');

    const where = {
      organizationId: session.user.organizationId,
    };

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (staffId) {
      where.staffId = staffId;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    const counts = await prisma.visit.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    const statusCounts = {};

    ALL_SCHEDULING_STATUSES.forEach((status) => {
      statusCounts[status] = 0;
    });

    counts.forEach((count) => {
      statusCounts[count.status] = count._count;
    });

    return NextResponse.json(statusCounts);
  } catch (error) {
    console.error('Error fetching status counts:', error);
    return NextResponse.json({ error: 'Failed to fetch status counts' }, { status: 500 });
  }
}
