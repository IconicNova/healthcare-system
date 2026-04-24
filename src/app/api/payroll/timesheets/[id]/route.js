import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasRoleAccess } from '@/lib/utils';
import { logAuditEvent } from '@/lib/audit-log';
import { rateLimit } from '@/lib/rate-limit';

// GET - Get timesheet detail with entries
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC
    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const organizationId = session.user.organizationId;

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
      include: {
        timesheetEntries: {
          include: {
            visit: {
              select: {
                startTime: true,
                endTime: true,
                actualStart: true,
                actualEnd: true,
                client: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
                service: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        staff: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
            hourlyRate: true,
            payType: true,
          },
        },
      },
    });

    if (!timesheet) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    // Verify timesheet belongs to organization
    if (timesheet.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Staff can only see their own timesheets — resolve Staff.id from User.id
    if (session.user.role === 'STAFF') {
      const staffProfile = await prisma.staff.findFirst({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (!staffProfile || timesheet.staffId !== staffProfile.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({
      ...timesheet,
      staffName: `${timesheet.staff.firstName} ${timesheet.staff.lastName}`,
    });
  } catch (error) {
    console.error('Error fetching timesheet:', error);
    return NextResponse.json({ error: 'Failed to fetch timesheet' }, { status: 500 });
  }
}

// PATCH - Approve/Reject timesheet
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC - only ADMIN, MANAGER can approve/reject
    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const organizationId = session.user.organizationId;
    const body = await request.json();
    const { status, reason } = body;

    const rateLimitResult = await rateLimit(`timesheets:update:${session.user.id}`, {
      maxRequests: 30,
      windowMs: 60 * 1000,
    });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many timesheet changes. Please try again shortly.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) },
        }
      );
    }

    // Validate status update
    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be APPROVED or REJECTED' },
        { status: 400 }
      );
    }

    const existingTimesheet = await prisma.timesheet.findUnique({
      where: { id },
    });

    if (!existingTimesheet) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    if (existingTimesheet.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Can only approve/reject SUBMITTED timesheets
    if (existingTimesheet.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Can only approve/reject SUBMITTED timesheets' },
        { status: 400 }
      );
    }

    const updatedTimesheet = await prisma.timesheet.update({
      where: { id },
      data: {
        status,
        ...(status === 'REJECTED' && reason && { notes: reason }),
      },
      include: {
        staff: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
      },
    });

    await logAuditEvent({
      action: 'UPDATE',
      entity: 'Timesheet',
      entityId: id,
      userId: session.user.id,
      before: existingTimesheet,
      after: updatedTimesheet,
    });

    return NextResponse.json({
      ...updatedTimesheet,
      staffName: `${updatedTimesheet.staff.firstName} ${updatedTimesheet.staff.lastName}`,
    });
  } catch (error) {
    console.error('Error updating timesheet:', error);
    return NextResponse.json({ error: 'Failed to update timesheet' }, { status: 500 });
  }
}
