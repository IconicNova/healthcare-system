import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
import { hasRoleAccess } from '@/lib/utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC - ADMIN, MANAGER, SUPERVISOR, and STAFF can access payroll
    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const organizationId = session.user.organizationId;

    // Get current week range
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Total timesheets (all time)
    const totalTimesheets = await prisma.timesheet.count({
      where: { organizationId },
    });

    // Pending approval (current week)
    const pendingApproval = await prisma.timesheet.count({
      where: {
        organizationId,
        status: 'SUBMITTED',
      },
    });

    // Approved this week
    const approvedThisWeek = await prisma.timesheet.count({
      where: {
        organizationId,
        status: 'APPROVED',
        updatedAt: { gte: startOfWeek },
      },
    });

    // Total hours this week (from approved timesheets)
    const hoursResult = await prisma.timesheet.aggregate({
      where: {
        organizationId,
        status: 'APPROVED',
        startDate: { gte: startOfWeek },
        endDate: { lte: endOfWeek },
      },
      _sum: { totalHours: true },
    });

    const totalHours = hoursResult._sum.totalHours || 0;

    return NextResponse.json({
      stats: {
        totalTimesheets,
        pendingApproval,
        approvedThisWeek,
        totalHours: parseFloat(totalHours.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Error fetching payroll stats:', error);
    return NextResponse.json({ error: 'Failed to fetch payroll stats' }, { status: 500 });
  }
}
