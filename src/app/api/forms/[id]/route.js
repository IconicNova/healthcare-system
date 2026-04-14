import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  canTransitionFormStatus,
  normalizeRejectionReason,
} from '@/components/care-delivery/forms-review.helpers';

function normalizeLegacyFormStatus(status) {
  if (status === 'PENDING') return 'DRAFT';
  if (status === 'COMPLETED') return 'SUBMITTED';
  return status || 'DRAFT';
}

// GET - Fetch a single form with template and relations
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const form = await prisma.clientForm.findFirst({
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

    return NextResponse.json({
      form: {
        ...form,
        status: normalizeLegacyFormStatus(form.status),
      },
    });
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

    const form = await prisma.clientForm.findFirst({
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

    const currentStatus = normalizeLegacyFormStatus(form.status);
    const updateData = {};

    if (formData !== undefined) {
      if (currentStatus !== 'DRAFT') {
        return NextResponse.json(
          { error: 'Submitted forms are read-only' },
          { status: 400 }
        );
      }

      updateData.formData = formData;
    }

    if (status) {
      if (
        !canTransitionFormStatus(currentStatus, status, {
          rejectionReason: normalizeRejectionReason(body.rejectionReason),
        })
      ) {
        return NextResponse.json(
          { error: 'Invalid form status transition' },
          { status: 400 }
        );
      }

      updateData.status = status;

      // Record lifecycle timestamps as the form moves through review.
      if (status === 'SUBMITTED' && !form.submittedAt) {
        updateData.submittedAt = new Date();
        updateData.submittedBy = session.user.id;
      }

      if (status === 'APPROVED' && !form.approvedAt) {
        updateData.approvedAt = new Date();
        updateData.approvedBy = session.user.id;
      }

      if (status === 'REJECTED' && !form.rejectedAt) {
        updateData.rejectedAt = new Date();
        updateData.rejectionReason = normalizeRejectionReason(body.rejectionReason);
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

    return NextResponse.json({
      form: {
        ...updatedForm,
        status: normalizeLegacyFormStatus(updatedForm.status),
      },
    });
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json({ error: 'Failed to update form' }, { status: 500 });
  }
}
