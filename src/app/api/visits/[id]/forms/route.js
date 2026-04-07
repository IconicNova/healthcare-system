import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch forms for a visit
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

    const forms = await prisma.clientForm.findMany({
      where: { visitId: id },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
            schema: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ forms });
  } catch (error) {
    console.error('Error fetching visit forms:', error);
    return NextResponse.json({ error: 'Failed to fetch visit forms' }, { status: 500 });
  }
}

// POST - Create a form linked to a visit
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { templateId, status } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Verify the visit belongs to the user's organization
    const visit = await prisma.visit.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: { client: true },
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    // Verify the template belongs to the organization
    const template = await prisma.formTemplate.findFirst({
      where: {
        id: templateId,
        organizationId: session.user.organizationId,
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const form = await prisma.clientForm.create({
      data: {
        templateId,
        visitId: id,
        clientId: visit.clientId,
        status: status || 'PENDING',
        formData: null,
        submittedBy: session.user.id,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
            schema: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    console.error('Error creating visit form:', error);
    return NextResponse.json({ error: 'Failed to create visit form' }, { status: 500 });
  }
}
