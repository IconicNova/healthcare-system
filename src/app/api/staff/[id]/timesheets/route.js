import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';

    // Verify staff belongs to organization
    const staff = await prisma.staff.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    const where = {
      staffId: id,
    };

    if (status) {
      where.status = status;
    }

    const timesheets = await prisma.timesheet.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        timesheetEntries: {
          select: {
            id: true,
            date: true,
            hours: true,
            notes: true,
            billable: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate overtime for each timesheet
    const timesheetsWithOvertime = timesheets.map(ts => {
      const regularHours = 40; // Weekly
      const overtime = Math.max(0, ts.totalHours - regularHours);
      return {
        ...ts,
        overtime,
        approvedBy: ts.user ? `${ts.user.firstName} ${ts.user.lastName}` : null,
      };
    });

    return NextResponse.json(timesheetsWithOvertime);
  } catch (error) {
    console.error('Error fetching staff timesheets:', error);
    return NextResponse.json({ error: 'Failed to fetch staff timesheets' }, { status: 500 });
  }
}
