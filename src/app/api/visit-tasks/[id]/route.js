import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

const TERMINAL_STATUSES = ['COMPLETED', 'APPROVED', 'CANCELLED'];

// PATCH - Update a visit task
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { completed, notes, title, priority, sortOrder } = body;

    // Find the task and verify it belongs to a visit in the user's organization
    const task = await prisma.visitTask.findFirst({
      where: {
        id,
        visit: {
          organizationId: session.user.organizationId,
        },
      },
      include: {
        visit: { select: { status: true, id: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // LOGIC-7: Block mutations on terminal visits
    if (TERMINAL_STATUSES.includes(task.visit.status)) {
      return NextResponse.json(
        { error: `Cannot modify tasks on a ${task.visit.status.toLowerCase()} visit` },
        { status: 400 }
      );
    }

    const updateData = {};
    if (completed !== undefined) updateData.completed = completed;
    if (notes !== undefined) updateData.notes = notes;
    if (title !== undefined) updateData.title = title;
    if (priority !== undefined) updateData.priority = priority;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const updatedTask = await prisma.visitTask.update({
      where: { id },
      data: updateData,
    });

    // Log activity for completion toggle
    if (completed !== undefined) {
      await prisma.visitActivity.create({
        data: {
          visitId: task.visit.id,
          action: completed ? 'TASK_COMPLETED' : 'TASK_UNCOMPLETED',
          details: `Task "${task.title}" ${completed ? 'completed' : 'uncompleted'}`,
          performedBy: session.user.name || session.user.email,
        },
      });
    }

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
      include: {
        visit: { select: { status: true, id: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // LOGIC-7: Block mutations on terminal visits
    if (TERMINAL_STATUSES.includes(task.visit.status)) {
      return NextResponse.json(
        { error: `Cannot delete tasks on a ${task.visit.status.toLowerCase()} visit` },
        { status: 400 }
      );
    }

    await prisma.visitTask.delete({
      where: { id },
    });

    // Log activity
    await prisma.visitActivity.create({
      data: {
        visitId: task.visit.id,
        action: 'TASK_DELETED',
        details: `Deleted task: ${task.title}`,
        performedBy: session.user.name || session.user.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting visit task:', error);
    return NextResponse.json({ error: 'Failed to delete visit task' }, { status: 500 });
  }
}
