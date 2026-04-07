import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch a single form with template and relations
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const form = await prisma.clientForm.findUnique({
      where: {
        id,
        client: {
          organizationId: session.user.organizationId,
        },
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
            schema: true,
            category: true,
            isRequired: true,
          },
        },
        visit: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            status: true,
            client: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    return NextResponse.json({ form });
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 });
  }
}

// PATCH - Update form data or status
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { formData, status } = body;

    const form = await prisma.clientForm.findUnique({
      where: {
        id,
        client: {
          organizationId: session.user.organizationId,
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const updateData = {};

    if (formData !== undefined) {
      updateData.formData = formData;
    }

    if (status) {
      updateData.status = status;

      // Set submittedAt when form is submitted
      if (status === 'SUBMITTED' && !form.submittedAt) {
        updateData.submittedAt = new Date();
        updateData.submittedBy = session.user.id;
      }
    }

    const updatedForm = await prisma.clientForm.update({
      where: { id },
      data: updateData,
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
        visit: {
          select: {
            id: true,
            title: true,
            startTime: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ form: updatedForm });
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json({ error: 'Failed to update form' }, { status: 500 });
  }
}
