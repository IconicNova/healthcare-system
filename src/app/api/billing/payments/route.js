import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasRoleAccess } from '@/lib/utils';
import { parsePaginationParams } from '@/lib/api-safety';
import { enforceRouteRateLimit } from '@/lib/route-rate-limit';
import { logAuditEvent } from '@/lib/audit-log';

// GET - List all payments with invoice info
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC - only ADMIN, MANAGER, SUPERVISOR can access billing
    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER', 'SUPERVISOR'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePaginationParams(searchParams, { defaultLimit: 10 });
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const organizationId = session.user.organizationId;

    // Build where clause
    const where = {
      invoice: {
        organizationId,
      },
    };

    // Add date range filter
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              client: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    // Format payments
    const formattedPayments = payments.map((payment) => ({
      ...payment,
      clientName: `${payment.invoice.client.firstName} ${payment.invoice.client.lastName}`,
      invoice: undefined, // Remove nested object
    }));

    // Calculate total payments
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      payments: formattedPayments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      totalAmount,
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST - Record a payment
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC - only ADMIN, MANAGER can record payments
    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rateLimitResponse = await enforceRouteRateLimit(session, 'payments-create', {
      maxRequests: 30,
      windowMs: 15 * 60 * 1000,
      message: 'Too many payment attempts. Please try again later.',
    });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { invoiceId, amount, paymentMethod, referenceNumber, paymentDate, notes } = body;

    // Validate required fields
    if (!invoiceId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: invoiceId, amount, paymentMethod' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Payment amount must be greater than 0' },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;

    // Get invoice and verify
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (invoice.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot record payment for cancelled invoice' },
        { status: 400 }
      );
    }

    // Calculate current balance
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = invoice.amount - totalPaid;

    if (amount > balanceDue) {
      return NextResponse.json(
        { error: `Payment amount exceeds balance due of ${balanceDue.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Create payment and update invoice status accordingly
    const payment = await prisma.$transaction(async (tx) => {
      // Create payment
      const newPayment = await tx.payment.create({
        data: {
          invoiceId,
          amount,
          paymentMethod,
          referenceNumber: referenceNumber || null,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          notes: notes || null,
        },
      });

      // Calculate new total
      const newTotalPaid = totalPaid + amount;

      // Update invoice status based on payment coverage
      if (newTotalPaid >= invoice.amount) {
        // Fully paid
        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            status: 'PAID',
            paidDate: new Date(),
          },
        });
      } else if (newTotalPaid > 0) {
        // Partially paid
        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            status: 'PARTIALLY_PAID',
          },
        });
      }

      return newPayment;
    });

    await logAuditEvent({
      action: 'CREATE',
      entity: 'Payment',
      entityId: payment.id,
      userId: session.user.id,
      after: payment,
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
