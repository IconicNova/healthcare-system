import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PATCH - Update a visit task
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { completed, notes, title } = body;

    // Find the task and verify it belongs to a visit in the user's organization
    const task = await prisma.visitTask.findFirst({
      where: {
        id,
        visit: {
          organizationId: session.user.organizationId,
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updateData = {};
    if (completed !== undefined) updateData.completed = completed;
    if (notes !== undefined) updateData.notes = notes;
    if (title !== undefined) updateData.title = title;

    const updatedTask = await prisma.visitTask.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating visit task:', error);
    return NextResponse.json({ error: 'Failed to update visit task' }, { status: 500 });
  }
}

// DELETE - Delete a visit task
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Find the task and verify it belongs to a visit in the user's organization
    const task = await prisma.visitTask.findFirst({
      where: {
        id,
        visit: {
          organizationId: session.user.organizationId,
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await prisma.visitTask.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting visit task:', error);
    return NextResponse.json({ error: 'Failed to delete visit task' }, { status: 500 });
  }
}
