import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { VitalSignPatchSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/audit-log';

// GET - Fetch a single vital sign entry
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const vital = await prisma.vitalSign.findFirst({
      where: {
        id,
        client: {
          organizationId: session.user.organizationId,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        visit: {
          select: {
            id: true,
            startTime: true,
          },
        },
      },
    });

    if (!vital) {
      return NextResponse.json({ error: 'Vital sign not found' }, { status: 404 });
    }

    return NextResponse.json(vital);
  } catch (error) {
    console.error('Error fetching vital sign:', error);
    return NextResponse.json({ error: 'Failed to fetch vital sign' }, { status: 500 });
  }
}

// PATCH - Update a vital sign entry
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const validationResult = VitalSignPatchSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const vital = await prisma.vitalSign.findFirst({
      where: {
        id,
        client: {
          organizationId: session.user.organizationId,
        },
      },
    });

    if (!vital) {
      return NextResponse.json({ error: 'Vital sign not found' }, { status: 404 });
    }

    if (validationResult.data.visitId !== undefined && validationResult.data.visitId !== null) {
      const visit = await prisma.visit.findFirst({
        where: {
          id: validationResult.data.visitId,
          organizationId: session.user.organizationId,
          clientId: vital.clientId,
        },
        select: { id: true },
      });

      if (!visit) {
        return NextResponse.json(
          { error: 'Selected visit is invalid for this client' },
          { status: 400 }
        );
      }
    }

    const updateData = {
      ...validationResult.data,
    };

    if (Object.prototype.hasOwnProperty.call(updateData, 'recordedAt') && updateData.recordedAt) {
      updateData.recordedAt = new Date(updateData.recordedAt);
    }

    const updatedVital = await prisma.vitalSign.update({
      where: { id },
      data: updateData,
    });

    await logAuditEvent({
      action: 'UPDATE',
      entity: 'VitalSign',
      entityId: updatedVital.id,
      userId: session.user.id,
      before: vital,
      after: updatedVital,
    });

    return NextResponse.json(updatedVital);
  } catch (error) {
    console.error('Error updating vital sign:', error);
    return NextResponse.json({ error: 'Failed to update vital sign' }, { status: 500 });
  }
}

// DELETE - Delete a vital sign entry
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const vital = await prisma.vitalSign.findFirst({
      where: {
        id,
        client: {
          organizationId: session.user.organizationId,
        },
      },
    });

    if (!vital) {
      return NextResponse.json({ error: 'Vital sign not found' }, { status: 404 });
    }

    await prisma.vitalSign.delete({
      where: { id },
    });

    await logAuditEvent({
      action: 'DELETE',
      entity: 'VitalSign',
      entityId: vital.id,
      userId: session.user.id,
      before: vital,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vital sign:', error);
    return NextResponse.json({ error: 'Failed to delete vital sign' }, { status: 500 });
  }
}
