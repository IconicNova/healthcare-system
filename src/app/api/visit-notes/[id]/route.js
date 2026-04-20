import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PATCH - Update a visit note
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    const note = await prisma.visitNote.findFirst({
      where: { id },
      include: {
        visit: { select: { organizationId: true, id: true } },
      },
    });

    if (!note || note.visit.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const updated = await prisma.visitNote.update({
      where: { id },
      data: { content: content.trim() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating visit note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

// DELETE - Delete a visit note
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const note = await prisma.visitNote.findFirst({
      where: { id },
      include: {
        visit: { select: { organizationId: true, id: true } },
      },
    });

    if (!note || note.visit.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    await prisma.visitNote.delete({ where: { id } });

    // Log activity
    await prisma.visitActivity.create({
      data: {
        visitId: note.visit.id,
        action: 'NOTE_DELETED',
        details: 'Deleted a visit note',
        performedBy: session.user.name || session.user.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting visit note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
