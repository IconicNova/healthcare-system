import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ProgressNoteSchema } from '@/lib/validations';

// GET - Fetch progress notes for a client
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Verify the client belongs to the user's organization
    const client = await prisma.client.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const notes = await prisma.progressNote.findMany({
      where: { clientId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        visit: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error fetching progress notes:', error);
    return NextResponse.json({ error: 'Failed to fetch progress notes' }, { status: 500 });
  }
}

// POST - Create a new progress note
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Verify the client belongs to the user's organization
    const client = await prisma.client.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Validate the data
    const validationResult = ProgressNoteSchema.safeParse({
      ...body,
      clientId: id,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { type, subjective, objective, assessment, plan, narrative, visitId } = validationResult.data;

    const note = await prisma.progressNote.create({
      data: {
        clientId: id,
        type,
        subjective: subjective || null,
        objective: objective || null,
        assessment: assessment || null,
        plan: plan || null,
        narrative: narrative || null,
        visitId: visitId || null,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating progress note:', error);
    return NextResponse.json({ error: 'Failed to create progress note' }, { status: 500 });
  }
}
