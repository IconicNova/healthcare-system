import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/lib/api-response';
import { normalizeVisitPayload, VALID_VISIT_STATUS_TRANSITIONS } from '@/lib/scheduling';
import { collectVisitConflicts, validateVisitBusinessRules } from '@/lib/visit-business-rules';
import { requireOrgRole } from '@/lib/api-safety';
import { logAuditEvent } from '@/lib/audit-log';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forbiddenResponse = requireOrgRole(session, ['STAFF']);
    if (forbiddenResponse) {
      return forbiddenResponse;
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
            dateOfBirth: true,
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
            staffId: true,
            staff: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        branch: {
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

// BUG-4 FIX: Removed inline VALID_STATUS_TRANSITIONS — uses VALID_VISIT_STATUS_TRANSITIONS from scheduling.js

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forbiddenResponse = requireOrgRole(session, ['STAFF']);
    if (forbiddenResponse) {
      return forbiddenResponse;
    }

    const { id } = params;
    const rawBody = await request.json();

    if (rawBody.status === 'VACANT' && rawBody.staffId) {
      return ApiResponse.error('Vacant visits cannot have assigned staff', 400, {
        staffId: ['Vacant visits cannot have assigned staff.'],
      });
    }

    const body = normalizeVisitPayload(rawBody);

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
      const allowed = VALID_VISIT_STATUS_TRANSITIONS[existing.status];
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
      return ApiResponse.error('End time must be after start time', 400);
    }

    const effectiveStaffId = body.staffId !== undefined ? body.staffId : existing.staffId;
    const effectiveClientId = body.clientId || existing.clientId;
    const effectiveServiceId = body.serviceId !== undefined ? body.serviceId : existing.serviceId;
    const effectiveCarePlanId = body.carePlanId !== undefined ? body.carePlanId : existing.carePlanId;
    const effectiveBranchId = body.branchId !== undefined ? body.branchId : existing.branchId;
    const businessValidation = await validateVisitBusinessRules({
      organizationId: session.user.organizationId,
      clientId: effectiveClientId,
      staffId: effectiveStaffId,
      serviceId: effectiveServiceId,
      carePlanId: effectiveCarePlanId,
      branchId: effectiveBranchId,
    });
    if (Object.keys(businessValidation.errors).length > 0) {
      return ApiResponse.error('Validation failed', 400, businessValidation.errors);
    }

    const timesOrAssignmentsChanged =
      body.startTime ||
      body.endTime ||
      body.staffId !== undefined ||
      body.clientId ||
      body.serviceId !== undefined ||
      body.carePlanId !== undefined;

    if (timesOrAssignmentsChanged && existing.status !== 'CANCELLED') {
      const conflicts = await collectVisitConflicts({
        organizationId: session.user.organizationId,
        visitId: id,
        clientId: effectiveClientId,
        staffId: effectiveStaffId,
        startTime: newStart,
        endTime: newEnd,
      });

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
        ...(body.serviceId !== undefined && { serviceId: body.serviceId }),
        ...(body.carePlanId !== undefined && { carePlanId: body.carePlanId }),
        ...(body.branchId !== undefined && { branchId: body.branchId }),
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        carePlan: {
          select: {
            id: true,
            name: true,
            staffId: true,
            staff: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    await logAuditEvent({
      organizationId: session.user.organizationId,
      action: 'UPDATE',
      entity: 'Visit',
      entityId: visit.id,
      userId: session.user.id,
      before: existing,
      after: visit,
    });

    return NextResponse.json({
      ...visit,
      warnings: businessValidation.warnings,
    });
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

    const forbiddenResponse = requireOrgRole(session, ['STAFF']);
    if (forbiddenResponse) {
      return forbiddenResponse;
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

    await logAuditEvent({
      organizationId: session.user.organizationId,
      action: 'DELETE',
      entity: 'Visit',
      entityId: existing.id,
      userId: session.user.id,
      before: existing,
    });

    return NextResponse.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('Error deleting visit:', error);
    return NextResponse.json({ error: 'Failed to delete visit' }, { status: 500 });
  }
}
