import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasRoleAccess } from '@/lib/utils';

// PATCH - Update timesheet entry
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC - only ADMIN, MANAGER can update entries
    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const organizationId = session.user.organizationId;
    const body = await request.json();
    const { hours, notes, billable } = body;

    // Get existing entry
    const existingEntry = await prisma.timesheetEntry.findUnique({
      where: { id },
      select: {
        id: true,
        hours: true,
        notes: true,
        billable: true,
        timesheetId: true,
        timesheet: {
          select: {
            id: true,
            organizationId: true,
            status: true,
          },
        },
      },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Timesheet entry not found' }, { status: 404 });
    }

    if (existingEntry.timesheet.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Can only update entries in DRAFT timesheets
    if (existingEntry.timesheet.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only update entries in DRAFT timesheets' },
        { status: 400 }
      );
    }

    // Update entry and recalculate total hours
    const entry = await prisma.$transaction(async (tx) => {
      const updatedEntry = await tx.timesheetEntry.update({
        where: { id },
        data: {
          ...(hours !== undefined && { hours: parseFloat(hours) }),
          ...(notes !== undefined && { notes }),
          ...(billable !== undefined && { billable }),
        },
      });

      // Recalculate total hours
      const total = await tx.timesheetEntry.aggregate({
        where: { timesheetId: existingEntry.timesheetId },
        _sum: { hours: true },
      });

      await tx.timesheet.update({
        where: { id: existingEntry.timesheetId },
        data: { totalHours: total._sum.hours || 0 },
      });

      return updatedEntry;
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error updating timesheet entry:', error);
    return NextResponse.json({ error: 'Failed to update timesheet entry' }, { status: 500 });
  }
}

// DELETE - Remove timesheet entry
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC - only ADMIN, MANAGER can delete entries
    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const organizationId = session.user.organizationId;

    // Get existing entry
    const existingEntry = await prisma.timesheetEntry.findUnique({
      where: { id },
      select: {
        id: true,
        hours: true,
        notes: true,
        billable: true,
        timesheetId: true,
        timesheet: {
          select: {
            id: true,
            organizationId: true,
            status: true,
          },
        },
      },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Timesheet entry not found' }, { status: 404 });
    }

    if (existingEntry.timesheet.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Can only delete entries from DRAFT timesheets
    if (existingEntry.timesheet.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only delete entries from DRAFT timesheets' },
        { status: 400 }
      );
    }

    // Delete entry and recalculate total hours
    await prisma.$transaction(async (tx) => {
      await tx.timesheetEntry.delete({
        where: { id },
      });

      // Recalculate total hours
      const total = await tx.timesheetEntry.aggregate({
        where: { timesheetId: existingEntry.timesheetId },
        _sum: { hours: true },
      });

      await tx.timesheet.update({
        where: { id: existingEntry.timesheetId },
        data: { totalHours: total._sum.hours || 0 },
      });
    });

    return NextResponse.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting timesheet entry:', error);
    return NextResponse.json({ error: 'Failed to delete timesheet entry' }, { status: 500 });
  }
}
