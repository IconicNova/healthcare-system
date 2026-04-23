import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { serializeApiValue } from '@/lib/serialization';
import { hasRoleAccess } from '@/lib/utils';

// GET - Get single insurance claim
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const organizationId = session.user.organizationId;

    const claim = await prisma.insuranceClaim.findFirst({
      where: { id, organizationId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            insuranceType: true,
            insuranceId: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            status: true,
            dueDate: true,
            createdAt: true,
            invoiceItems: {
              select: {
                id: true,
                description: true,
                quantity: true,
                unitPrice: true,
                amount: true,
              },
            },
          },
        },
      },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    return NextResponse.json(serializeApiValue({ claim }));
  } catch (error) {
    console.error('Error fetching insurance claim:', error);
    return NextResponse.json({ error: 'Failed to fetch claim' }, { status: 500 });
  }
}

// PATCH - Update insurance claim status
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const organizationId = session.user.organizationId;
    const body = await request.json();

    const claim = await prisma.insuranceClaim.findFirst({
      where: { id, organizationId },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    const updateData = {};

    if (body.status) {
      updateData.status = body.status;

      // Auto-set dates based on status
      if (body.status === 'SUBMITTED' && !claim.submittedDate) {
        updateData.submittedDate = new Date();
      }

      if (['APPROVED', 'DENIED', 'PAID'].includes(body.status) && !claim.responseDate) {
        updateData.responseDate = new Date();
      }
    }

    if (body.approvedAmount !== undefined) updateData.approvedAmount = Number(body.approvedAmount);
    if (body.denialReason !== undefined) updateData.denialReason = body.denialReason;
    if (body.diagnosisCode !== undefined) updateData.diagnosisCode = body.diagnosisCode;
    if (body.authorizationNumber !== undefined) updateData.authorizationNumber = body.authorizationNumber;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const updatedClaim = await prisma.insuranceClaim.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
        invoice: {
          select: { id: true, invoiceNumber: true, amount: true },
        },
      },
    });

    return NextResponse.json(serializeApiValue({ claim: updatedClaim }));
  } catch (error) {
    console.error('Error updating insurance claim:', error);
    return NextResponse.json({ error: 'Failed to update claim' }, { status: 500 });
  }
}
