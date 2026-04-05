import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { subDays, startOfWeek, format } from 'date-fns';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);

    // Get visits for the last 7 days
    const visits = await prisma.visit.findMany({
      where: {
        organizationId: session.user.organizationId,
        startTime: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        startTime: true,
        status: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Group visits by day and status
    const chartData = [];
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayVisits = visits.filter(v =>
        v.startTime >= dayStart && v.startTime <= dayEnd
      );

      const scheduled = dayVisits.filter(v => v.status === 'SCHEDULED').length;
      const completed = dayVisits.filter(v => v.status === 'COMPLETED').length;
      const cancelled = dayVisits.filter(v => v.status === 'CANCELLED').length;

      chartData.push({
        date: format(date, 'MMM d'),
        scheduled,
        completed,
        cancelled,
      });

      days.push(format(date, 'MMM d'));
    }

    return NextResponse.json({
      labels: days,
      data: chartData,
    });
  } catch (error) {
    console.error('Error fetching visit chart data:', error);
    return NextResponse.json({ error: 'Failed to fetch visit chart data' }, { status: 500 });
  }
}
