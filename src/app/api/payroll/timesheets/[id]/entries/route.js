import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasRoleAccess } from '@/lib/utils';

// POST - Add manual entry to timesheet
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC - only ADMIN, MANAGER, STAFF can add entries
    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER', 'STAFF'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const organizationId = session.user.organizationId;
    const body = await request.json();
    const { date, hours, notes, billable, visitId } = body;

    // Validate required fields
    if (!date || hours === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: date, hours' },
        { status: 400 }
      );
    }

    if (hours <= 0) {
      return NextResponse.json(
        { error: 'Hours must be greater than 0' },
        { status: 400 }
      );
    }

    // Get timesheet
    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
    });

    if (!timesheet) {
      return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
    }

    if (timesheet.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Staff can only modify their own timesheets
    if (session.user.role === 'STAFF') {
      // Resolve staff record by userId first, then compare Staff.id
      const staffRecord = await prisma.staff.findFirst({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (!staffRecord || timesheet.staffId !== staffRecord.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Can only add entries to DRAFT timesheets
    if (timesheet.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only add entries to DRAFT timesheets' },
        { status: 400 }
      );
    }

    // Validate date is within timesheet range
    const entryDate = new Date(date);
    if (entryDate < timesheet.startDate || entryDate > timesheet.endDate) {
      return NextResponse.json(
        { error: 'Entry date must be within timesheet period' },
        { status: 400 }
      );
    }

    // Create entry and update total hours
    const entry = await prisma.$transaction(async (tx) => {
      const newEntry = await tx.timesheetEntry.create({
        data: {
          date: entryDate,
          hours: parseFloat(hours),
          notes: notes || null,
          billable: billable !== false, // Default to true
          timesheetId: id,
          visitId: visitId || null,
        },
      });

      // Recalculate total hours
      const total = await tx.timesheetEntry.aggregate({
        where: { timesheetId: id },
        _sum: { hours: true },
      });

      await tx.timesheet.update({
        where: { id },
        data: { totalHours: total._sum.hours || 0 },
      });

      return newEntry;
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Error adding timesheet entry:', error);
    return NextResponse.json({ error: 'Failed to add timesheet entry' }, { status: 500 });
  }
}
