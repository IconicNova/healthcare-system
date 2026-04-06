import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const excludeVisitId = searchParams.get('excludeVisitId');

    if (!staffId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'staffId, startTime, and endTime are required' },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const conflicts = await prisma.visit.findMany({
      where: {
        staffId,
        organizationId: session.user.organizationId,
        status: { not: 'CANCELLED' },
        ...(excludeVisitId && { id: { not: excludeVisitId } }),
        OR: [
          {
            startTime: { lte: end },
            endTime: { gte: start },
          },
        ],
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(conflicts);
  } catch (error) {
    console.error('Error checking conflicts:', error);
    return NextResponse.json({ error: 'Failed to check conflicts' }, { status: 500 });
  }
}
