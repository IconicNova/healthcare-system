import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, parseISO, format } from 'date-fns';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom') || format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const dateTo = searchParams.get('dateTo') || format(endOfMonth(new Date()), 'yyyy-MM-dd');

    const fromDate = parseISO(dateFrom);
    const toDate = parseISO(dateTo);

    // Get all staff with their visits
    const staff = await prisma.staff.findMany({
      where: {
        organizationId: session.user.organizationId,
        status: 'ACTIVE',
      },
      include: {
        visits: {
          where: {
            startTime: {
              gte: fromDate,
              lte: toDate,
            },
          },
          include: {
            service: true,
            visitTasks: true,
          },
        },
        certifications: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    });

    const performanceData = staff.map(staffMember => {
      const visits = staffMember.visits;
      const totalVisits = visits.length;
      const completed = visits.filter(v => v.status === 'COMPLETED' || v.status === 'APPROVED').length;
      const missed = visits.filter(v => v.status === 'MISSED' || v.status === 'NO_SHOW').length;
      const completionRate = totalVisits > 0 ? ((completed / totalVisits) * 100).toFixed(1) : 0;

      // Calculate average duration
      let totalDuration = 0;
      visits.forEach(v => {
        if (v.actualStart && v.actualEnd) {
          totalDuration += (new Date(v.actualEnd) - new Date(v.actualStart)) / (1000 * 60 * 60);
        } else if (v.startTime && v.endTime) {
          totalDuration += (new Date(v.endTime) - new Date(v.startTime)) / (1000 * 60 * 60);
        }
      });
      const avgDuration = totalVisits > 0 ? (totalDuration / totalVisits).toFixed(2) : 0;

      // Calculate punctuality (within 6 minutes of scheduled start)
      let onTimeCount = 0;
      visits.forEach(v => {
        if (v.actualStart && v.startTime) {
          const diffMinutes = Math.abs(new Date(v.actualStart) - new Date(v.startTime)) / (1000 * 60);
          if (diffMinutes <= 6) {
            onTimeCount++;
          }
        }
      });
      const punctuality = totalVisits > 0 ? ((onTimeCount / totalVisits) * 100).toFixed(1) : 0;

      // Count forms submitted (placeholder - would need to query forms table)
      const formsSubmitted = Math.floor(totalVisits * 0.8); // Placeholder

      return {
        id: staffMember.id,
        name: `${staffMember.firstName} ${staffMember.lastName}`,
        role: staffMember.role,
        totalVisits,
        completed,
        missed,
        completionRate: parseFloat(completionRate),
        avgDuration: parseFloat(avgDuration),
        punctuality: parseFloat(punctuality),
        formsSubmitted,
        rating: 4.5, // Placeholder
      };
    });

    // Sort by completion rate descending
    performanceData.sort((a, b) => b.completionRate - a.completionRate);

    return NextResponse.json({
      staffPerformance: performanceData,
      dateFrom,
      dateTo,
    });
  } catch (error) {
    console.error('Error fetching staff performance report:', error);
    return NextResponse.json({ error: 'Failed to fetch staff performance report' }, { status: 500 });
  }
}
