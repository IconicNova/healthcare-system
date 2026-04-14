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

    const visit = await prisma.visit.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            phone: true,
            email: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            role: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            baseRate: true,
          },
        },
        carePlan: {
          select: {
            id: true,
            name: true,
          },
        },
        visitTasks: {
          select: {
            id: true,
            title: true,
            completed: true,
            notes: true,
          },
        },
        visitNotes: {
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
        medAdministrations: {
          select: {
            id: true,
            dosage: true,
            administeredAt: true,
            status: true,
          },
        },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    return NextResponse.json(visit);
  } catch (error) {
    console.error('Error fetching visit:', error);
    return NextResponse.json({ error: 'Failed to fetch visit' }, { status: 500 });
  }
}

// Valid status transitions — prevents illegal moves like CANCELLED→APPROVED
const VALID_STATUS_TRANSITIONS = {
  VACANT: ['SCHEDULED', 'OFFERED', 'CANCELLED'],
  SCHEDULED: ['IN_PROGRESS', 'CLOCKED_IN', 'CANCELLED', 'ON_HOLD', 'VACANT', 'OFFERED'],
  OFFERED: ['SCHEDULED', 'VACANT', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CLOCKED_IN', 'CANCELLED', 'ON_HOLD'],
  CLOCKED_IN: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  COMPLETED: ['APPROVED'],
  APPROVED: [], // Terminal — no further transitions
  MISSED: ['SCHEDULED'], // Allow rescheduling
  LATE: ['IN_PROGRESS', 'CLOCKED_IN', 'COMPLETED', 'CANCELLED'],
  CANCELLED: [], // Terminal — cannot un-cancel
  ON_HOLD: ['SCHEDULED', 'CANCELLED'],
  NO_SHOW: ['SCHEDULED'], // Allow rescheduling
};

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const existing = await prisma.visit.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    // Validate status transition if status is being changed
    if (body.status && body.status !== existing.status) {
      const allowed = VALID_STATUS_TRANSITIONS[existing.status];
      if (!allowed || !allowed.includes(body.status)) {
        return NextResponse.json(
          { error: `Cannot transition from "${existing.status}" to "${body.status}". Allowed transitions: ${(allowed || []).join(', ') || 'none (terminal status)'}` },
          { status: 400 }
        );
      }
    }

    // Validate time logic if times are being updated
    const newStart = body.startTime ? new Date(body.startTime) : existing.startTime;
    const newEnd = body.endTime ? new Date(body.endTime) : existing.endTime;
    if (newEnd <= newStart) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Re-run scheduling conflict checks when times or assignments change
    const effectiveStaffId = body.staffId !== undefined ? body.staffId : existing.staffId;
    const effectiveClientId = body.clientId || existing.clientId;
    const timesOrAssignmentsChanged = body.startTime || body.endTime || body.staffId !== undefined || body.clientId;

    if (timesOrAssignmentsChanged && existing.status !== 'CANCELLED') {
      let conflicts = [];

      // Staff conflict check
      if (effectiveStaffId) {
        const staffConflicts = await prisma.visit.findMany({
          where: {
            staffId: effectiveStaffId,
            organizationId: session.user.organizationId,
            id: { not: id },
            status: { not: 'CANCELLED' },
            OR: [{
              startTime: { lte: newEnd },
              endTime: { gte: newStart },
            }],
          },
        });
        conflicts = staffConflicts.map(v => ({
          type: 'STAFF', visitId: v.id, startTime: v.startTime, endTime: v.endTime,
        }));
      }

      // Client conflict check
      const clientConflicts = await prisma.visit.findMany({
        where: {
          clientId: effectiveClientId,
          organizationId: session.user.organizationId,
          id: { not: id },
          status: { not: 'CANCELLED' },
          OR: [{
            startTime: { lte: newEnd },
            endTime: { gte: newStart },
          }],
        },
      });
      conflicts = conflicts.concat(clientConflicts.map(v => ({
        type: 'CLIENT', visitId: v.id, startTime: v.startTime, endTime: v.endTime,
      })));

      if (conflicts.length > 0) {
        return NextResponse.json(
          { error: 'Time slot conflict detected', conflicts },
          { status: 409 }
        );
      }
    }

    const visit = await prisma.visit.update({
      where: { id },
      data: {
        ...(body.startTime && { startTime: new Date(body.startTime) }),
        ...(body.endTime && { endTime: new Date(body.endTime) }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.actualStart !== undefined && { actualStart: body.actualStart ? new Date(body.actualStart) : null }),
        ...(body.actualEnd !== undefined && { actualEnd: body.actualEnd ? new Date(body.actualEnd) : null }),
        ...(body.clientId && { clientId: body.clientId }),
        ...(body.staffId !== undefined && { staffId: body.staffId }),
        ...(body.serviceId && { serviceId: body.serviceId }),
        ...(body.carePlanId && { carePlanId: body.carePlanId }),
        ...(body.branchId !== undefined && { branchId: body.branchId }),
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            address: true,
            city: true,
            state: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
      },
    });

    return NextResponse.json(visit);
  } catch (error) {
    console.error('Error updating visit:', error);
    return NextResponse.json({ error: 'Failed to update visit' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const existing = await prisma.visit.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    // Prevent deletion of visits in terminal statuses (may have billing/compliance records)
    const undeletableStatuses = ['COMPLETED', 'APPROVED'];
    if (undeletableStatuses.includes(existing.status)) {
      return NextResponse.json(
        { error: `Cannot delete a visit with status "${existing.status}". Cancel it first or contact an administrator.` },
        { status: 400 }
      );
    }

    await prisma.visit.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('Error deleting visit:', error);
    return NextResponse.json({ error: 'Failed to delete visit' }, { status: 500 });
  }
}
