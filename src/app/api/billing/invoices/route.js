import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { randomUUID } from 'crypto';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasRoleAccess } from '@/lib/utils';
import { InvoiceSchema } from '@/lib/validations';
import { ApiResponse } from '@/lib/api-response';
import { parsePaginationParams } from '@/lib/api-safety';
import { logAuditEvent } from '@/lib/audit-log';
import { rateLimit } from '@/lib/rate-limit';

// GET - List invoices with pagination, search, filter
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
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // Whitelist valid sort fields to prevent information disclosure
    const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'amount', 'dueDate', 'invoiceNumber', 'status'];
    const ALLOWED_ORDER_VALUES = ['asc', 'desc'];
    const sort = ALLOWED_SORT_FIELDS.includes(searchParams.get('sort')) ? searchParams.get('sort') : 'createdAt';
    const order = ALLOWED_ORDER_VALUES.includes(searchParams.get('order')) ? searchParams.get('order') : 'desc';

    const organizationId = session.user.organizationId;

    // Build where clause
    const where = {
      organizationId,
    };

    // Add search filter
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { client: { OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ] } },
      ];
    }

    // Add status filter
    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              invoiceItems: true,
              payments: true,
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    // Format client names
    const formattedInvoices = invoices.map((invoice) => ({
      ...invoice,
      clientName: `${invoice.client.firstName} ${invoice.client.lastName}`,
      client: undefined, // Remove nested client object
    }));

    return NextResponse.json({
      invoices: formattedInvoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

// POST - Create invoice with line items
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC - only ADMIN, MANAGER can create invoices
    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const organizationId = session.user.organizationId;

    const rateLimitResult = await rateLimit(`billing:invoices:create:${session.user.id}`, {
      maxRequests: 30,
      windowMs: 60 * 1000,
    });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many invoice changes. Please try again shortly.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) },
        }
      );
    }

    const body = await request.json();

    const validationResult = InvoiceSchema.safeParse(body);
    if (!validationResult.success) {
      return ApiResponse.error('Validation failed', 400, validationResult.error.format());
    }

    const { clientId, dueDate, notes, invoiceItems, branchId } = body;

    // Guard: invoiceItems must be present with at least one item
    if (!invoiceItems || !Array.isArray(invoiceItems) || invoiceItems.length === 0) {
      return ApiResponse.error('At least one invoice line item is required', 400);
    }

    // Validate due date is not in the past
    const dueDateObj = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDateObj < today) {
      return ApiResponse.error('Due date cannot be in the past', 400);
    }

    // Calculate total amount from invoice items
    const totalAmount = invoiceItems.reduce((sum, item) => {
      return sum + ((item.quantity || 1) * (item.unitPrice || 0));
    }, 0);

    // Create invoice with items in transaction (includes number generation to prevent races)
    const invoice = await prisma.$transaction(async (tx) => {
      // Generate collision-safe invoice number using timestamp + random suffix
      const now = new Date();
      const yearMonth = now.toISOString().slice(0, 7).replace('-', '');
      const suffix = randomUUID().slice(0, 8).toUpperCase();
      const invoiceNumber = `INV-${yearMonth}-${suffix}`;

      const createdInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          amount: totalAmount,
          status: 'DRAFT',
          dueDate: new Date(dueDate),
          notes,
          organizationId,
          branchId: branchId || null,
          clientId,
          userId: session.user.id,
        },
      });

      // Create invoice items
      if (invoiceItems && invoiceItems.length > 0) {
        await tx.invoiceItem.createMany({
          data: invoiceItems.map((item) => ({
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            amount: (item.quantity || 1) * (item.unitPrice || 0),
            invoiceId: createdInvoice.id,
            visitId: item.visitId || null,
            serviceId: item.serviceId || null,
          })),
        });
      }

      return tx.invoice.findUnique({
        where: { id: createdInvoice.id },
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

    await logAuditEvent({
      action: 'CREATE',
      entity: 'Invoice',
      entityId: invoice.id,
      userId: session.user.id,
      after: invoice,
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
