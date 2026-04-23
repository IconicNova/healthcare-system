import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { pickAllowedFields, requireClinicalRole } from '@/lib/api-safety';

// GET - Fetch a single progress note
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forbiddenResponse = requireClinicalRole(session);
    if (forbiddenResponse) {
      return forbiddenResponse;
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

    const forbiddenResponse = requireClinicalRole(session);
    if (forbiddenResponse) {
      return forbiddenResponse;
    }

    const { id } = params;
    const body = await request.json();

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

    const allowedUpdate = pickAllowedFields(body, [
      'type',
      'subjective',
      'objective',
      'assessment',
      'plan',
      'narrative',
      'visitId',
    ]);

    const updatedNote = await prisma.progressNote.update({
      where: { id },
      data: allowedUpdate,
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

    const forbiddenResponse = requireClinicalRole(session);
    if (forbiddenResponse) {
      return forbiddenResponse;
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting progress note:', error);
    return NextResponse.json({ error: 'Failed to delete progress note' }, { status: 500 });
  }
}
