import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { normalizeFormSchema, normalizeFormStatus } from '@/lib/form-review';
import { buildFormPrefillData } from '@/lib/form-prefill';

function isUniqueConstraintError(error) {
  return error?.code === 'P2002';
}

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
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            phone: true,
            email: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            role: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            baseRate: true,
          },
        },
        carePlan: {
          select: {
            id: true,
            name: true,
            staffId: true,
            staff: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
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

    return NextResponse.json({
      forms: forms.map((form) => ({
        ...form,
        template: form.template
          ? {
              ...form.template,
              schema: normalizeFormSchema(form.template.schema),
            }
          : null,
        status: normalizeFormStatus(form.status),
      })),
    });
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
    const { templateId } = body;

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
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            phone: true,
            email: true,
          },
        },
      },
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

    const existingForm = await prisma.clientForm.findFirst({
      where: {
        visitId: id,
        templateId,
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
      orderBy: { createdAt: 'desc' },
    });

    if (existingForm) {
      return NextResponse.json({
        form: {
          ...existingForm,
          template: existingForm.template
            ? {
                ...existingForm.template,
                schema: normalizeFormSchema(existingForm.template.schema),
              }
            : null,
          status: normalizeFormStatus(existingForm.status),
        },
      });
    }

    const prefillData = buildFormPrefillData({
      template,
      visit,
    });
    const providedPrefillData =
      body?.prefillData && typeof body.prefillData === 'object' && !Array.isArray(body.prefillData)
        ? body.prefillData
        : {};

    let form;

    try {
      form = await prisma.clientForm.create({
        data: {
          templateId,
          visitId: id,
          clientId: visit.clientId,
          status: 'DRAFT',
          formData: Object.keys({ ...prefillData, ...providedPrefillData }).length > 0
            ? { ...prefillData, ...providedPrefillData }
            : null,
          submittedBy: null,
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
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const concurrentForm = await prisma.clientForm.findFirst({
        where: {
          visitId: id,
          templateId,
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
        orderBy: { createdAt: 'desc' },
      });

      if (!concurrentForm) {
        throw error;
      }

      return NextResponse.json({
        form: {
          ...concurrentForm,
          template: concurrentForm.template
            ? {
                ...concurrentForm.template,
                schema: normalizeFormSchema(concurrentForm.template.schema),
              }
            : null,
          status: normalizeFormStatus(concurrentForm.status),
        },
      });
    }

    return NextResponse.json({
      form: {
        ...form,
        template: form.template
          ? {
              ...form.template,
              schema: normalizeFormSchema(form.template.schema),
            }
          : null,
        status: normalizeFormStatus(form.status),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating visit form:', error);
    return NextResponse.json({ error: 'Failed to create visit form' }, { status: 500 });
  }
}
