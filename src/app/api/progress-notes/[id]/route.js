import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ProgressNotePatchSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/audit-log';

// GET - Fetch a single progress note
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const note = await prisma.progressNote.findFirst({
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
            endTime: true,
          },
        },
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Progress note not found' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error fetching progress note:', error);
    return NextResponse.json({ error: 'Failed to fetch progress note' }, { status: 500 });
  }
}

// PATCH - Update a progress note
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const validationResult = ProgressNotePatchSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const note = await prisma.progressNote.findFirst({
      where: {
        id,
        client: {
          organizationId: session.user.organizationId,
        },
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Progress note not found' }, { status: 404 });
    }

    if (validationResult.data.visitId !== undefined && validationResult.data.visitId !== null) {
      const visit = await prisma.visit.findFirst({
        where: {
          id: validationResult.data.visitId,
          organizationId: session.user.organizationId,
          clientId: note.clientId,
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

    const updatedNote = await prisma.progressNote.update({
      where: { id },
      data: {
        ...validationResult.data,
        ...(validationResult.data.visitId === undefined ? {} : { visitId: validationResult.data.visitId }),
      },
    });

    await logAuditEvent({
      action: 'UPDATE',
      entity: 'ProgressNote',
      entityId: updatedNote.id,
      userId: session.user.id,
      before: note,
      after: updatedNote,
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Error updating progress note:', error);
    return NextResponse.json({ error: 'Failed to update progress note' }, { status: 500 });
  }
}

// DELETE - Delete a progress note
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const note = await prisma.progressNote.findFirst({
      where: {
        id,
        client: {
          organizationId: session.user.organizationId,
        },
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Progress note not found' }, { status: 404 });
    }

    await prisma.progressNote.delete({
      where: { id },
    });

    await logAuditEvent({
      action: 'DELETE',
      entity: 'ProgressNote',
      entityId: note.id,
      userId: session.user.id,
      before: note,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting progress note:', error);
    return NextResponse.json({ error: 'Failed to delete progress note' }, { status: 500 });
  }
}
