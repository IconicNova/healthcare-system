import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch tasks for a visit
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Verify the visit belongs to the user's organization
    const visit = await prisma.visit.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    const tasks = await prisma.visitTask.findMany({
      where: { visitId: id },
      orderBy: { createdAt: 'asc' },
    });

    // Group tasks by category if needed
    const groupedTasks = tasks.reduce((acc, task) => {
      const category = task.category || 'General';
      if (!acc[category]) acc[category] = [];
      acc[category].push(task);
      return acc;
    }, {});

    return NextResponse.json({
      tasks,
      grouped: groupedTasks,
    });
  } catch (error) {
    console.error('Error fetching visit tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch visit tasks' }, { status: 500 });
  }
}

// POST - Add a task to a visit
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { title, category, notes } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    // Verify the visit belongs to the user's organization
    const visit = await prisma.visit.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    const task = await prisma.visitTask.create({
      data: {
        title: title.trim(),
        category: category || 'General',
        notes: notes || null,
        completed: false,
        visitId: id,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating visit task:', error);
    return NextResponse.json({ error: 'Failed to create visit task' }, { status: 500 });
  }
}
