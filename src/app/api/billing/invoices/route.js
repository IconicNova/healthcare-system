import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasRoleAccess } from '@/lib/utils';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    const organizationId = session.user.organizationId;

    // Build where clause
    const where = {
      organizationId,
    };

    // Add search filter
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { client: { firstName: { contains: search, mode: 'insensitive' } } },
        { client: { lastName: { contains: search, mode: 'insensitive' } } },
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

    const body = await request.json();
    const { clientId, dueDate, notes, invoiceItems, branchId } = body;

    // Validate required fields
    if (!clientId || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, dueDate' },
        { status: 400 }
      );
    }

    // Validate invoiceItems
    if (!invoiceItems || !Array.isArray(invoiceItems) || invoiceItems.length === 0) {
      return NextResponse.json(
        { error: 'At least one invoice item is required' },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;

    // Generate invoice number: INV-{YYYYMM}-{sequence}
    const now = new Date();
    const yearMonth = now.toISOString().slice(0, 7).replace('-', '');
    const existingCount = await prisma.invoice.count({
      where: {
        organizationId,
        invoiceNumber: { startsWith: `INV-${yearMonth}-` },
      },
    });
    const sequence = String(existingCount + 1).padStart(4, '0');
    const invoiceNumber = `INV-${yearMonth}-${sequence}`;

    // Calculate total amount
    const totalAmount = invoiceItems.reduce(
      (sum, item) => sum + (item.quantity || 1) * (item.unitPrice || 0),
      0
    );

    // Create invoice with items in transaction
    const invoice = await prisma.$transaction(async (tx) => {
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

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
