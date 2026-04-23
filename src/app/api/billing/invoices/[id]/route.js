import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasRoleAccess } from '@/lib/utils';
import { serializeApiValue } from '@/lib/serialization';

// GET - Get invoice detail with items and payments
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC - only ADMIN, MANAGER, SUPERVISOR can access billing
    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER', 'SUPERVISOR'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const organizationId = session.user.organizationId;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        invoiceItems: {
          include: {
            visit: {
              select: {
                startTime: true,
                endTime: true,
                title: true,
              },
            },
            service: {
              select: {
                name: true,
                baseRate: true,
              },
            },
          },
        },
        payments: true,
        client: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify invoice belongs to organization
    if (invoice.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate total payments
    const totalPaid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const balanceDue = Number(invoice.amount) - totalPaid;

    return NextResponse.json(serializeApiValue({
      ...invoice,
      clientName: `${invoice.client.firstName} ${invoice.client.lastName}`,
      userName: invoice.user ? `${invoice.user.firstName} ${invoice.user.lastName}` : null,
      totalPaid,
      balanceDue,
    }));
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

// PATCH - Update invoice (draft only)
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC - only ADMIN, MANAGER can update invoices
    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const organizationId = session.user.organizationId;
    const body = await request.json();

    // Get existing invoice
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify invoice belongs to organization
    if (existingInvoice.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow updating DRAFT invoices
    if (existingInvoice.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only update invoices in DRAFT status' },
        { status: 400 }
      );
    }

    // Update invoice
    const { clientId, dueDate, notes, invoiceItems } = body;

    let updatedInvoice;

    if (invoiceItems) {
      // Update with new line items - need to recalculate total
      const totalAmount = invoiceItems.reduce(
        (sum, item) => sum + (item.quantity || 1) * Number(item.unitPrice || 0),
        0
      );

      updatedInvoice = await prisma.$transaction(async (tx) => {
        // Update invoice
        await tx.invoice.update({
          where: { id },
          data: {
            ...(clientId && { clientId }),
            ...(dueDate && { dueDate: new Date(dueDate) }),
            ...(notes !== undefined && { notes }),
            amount: totalAmount,
          },
        });

        // Delete existing items
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: id },
        });

        // Create new items
        await tx.invoiceItem.createMany({
          data: invoiceItems.map((item) => ({
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: Number(item.unitPrice || 0),
            amount: (item.quantity || 1) * Number(item.unitPrice || 0),
            invoiceId: id,
            visitId: item.visitId || null,
            serviceId: item.serviceId || null,
          })),
        });

        return tx.invoice.findUnique({
          where: { id },
          include: {
            invoiceItems: true,
            client: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        });
      });
    } else {
      // Update without changing line items
      updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: {
          ...(clientId && { clientId }),
          ...(dueDate && { dueDate: new Date(dueDate) }),
          ...(notes !== undefined && { notes }),
        },
        include: {
          invoiceItems: true,
          client: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    }

    return NextResponse.json(serializeApiValue(updatedInvoice));
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

// DELETE - Cancel invoice
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC - only ADMIN, MANAGER can delete invoices
    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const organizationId = session.user.organizationId;

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify invoice belongs to organization
    if (existingInvoice.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete by changing status to CANCELLED
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json(serializeApiValue({
      message: 'Invoice cancelled successfully',
      invoice: updatedInvoice,
    }));
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    return NextResponse.json({ error: 'Failed to cancel invoice' }, { status: 500 });
  }
}
