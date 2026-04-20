import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

const TERMINAL_STATUSES = ['COMPLETED', 'APPROVED', 'CANCELLED'];

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
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
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
      visitStatus: visit.status,
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
    const { title, category, notes, priority } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    // LOGIC-5: Title length validation
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      return NextResponse.json(
        { error: 'Task title must be at least 3 characters' },
        { status: 400 }
      );
    }
    if (trimmedTitle.length > 200) {
      return NextResponse.json(
        { error: 'Task title must be under 200 characters' },
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

    // LOGIC-7: Block mutations on terminal visits
    if (TERMINAL_STATUSES.includes(visit.status)) {
      return NextResponse.json(
        { error: `Cannot add tasks to a ${visit.status.toLowerCase()} visit` },
        { status: 400 }
      );
    }

    // BUG-3: Duplicate check — same title + category on same visit
    const existing = await prisma.visitTask.findFirst({
      where: {
        visitId: id,
        title: trimmedTitle,
        category: category || 'General',
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A task with this title already exists in this category' },
        { status: 409 }
      );
    }

    // Get max sortOrder for this visit
    const maxSort = await prisma.visitTask.aggregate({
      where: { visitId: id },
      _max: { sortOrder: true },
    });

    const task = await prisma.visitTask.create({
      data: {
        title: trimmedTitle,
        category: category || 'General',
        notes: notes || null,
        priority: priority || 'MEDIUM',
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
        completed: false,
        visitId: id,
      },
    });

    // Log activity
    await prisma.visitActivity.create({
      data: {
        visitId: id,
        action: 'TASK_ADDED',
        details: `Added task: ${trimmedTitle}`,
        performedBy: session.user.name || session.user.email,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating visit task:', error);
    return NextResponse.json({ error: 'Failed to create visit task' }, { status: 500 });
  }
}
