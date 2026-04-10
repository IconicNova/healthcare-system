import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasRoleAccess } from '@/lib/utils';

// POST - Batch generate invoices from uninvoiced visits
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC - only ADMIN, MANAGER can generate invoices
    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { clientIds, startDate, endDate } = body;

    // Validate required fields
    if (!Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one client must be selected' },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;

    // Build where clause for visits
    const where = {
      organizationId,
      status: 'COMPLETED',
      invoiceId: null, // Not yet invoiced
      clientId: { in: clientIds },
    };

    // Add date range if provided
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Get visits grouped by client
    const visits = await prisma.visit.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            rate: true,
            duration: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    if (visits.length === 0) {
      return NextResponse.json(
        { error: 'No uninvoiced visits found for selected clients' },
        { status: 400 }
      );
    }

    // Group visits by client
    const visitsByClient = visits.reduce((acc, visit) => {
      if (!acc[visit.clientId]) {
        acc[visit.clientId] = [];
      }
      acc[visit.clientId].push(visit);
      return acc;
    }, {});

    // Generate invoices in transaction
    const generatedInvoices = await prisma.$transaction(async (tx) => {
      const invoices = [];

      for (const [clientId, clientVisits] of Object.entries(visitsByClient)) {
        // Generate invoice number: INV-{YYYYMM}-{sequence}
        const now = new Date();
        const yearMonth = now.toISOString().slice(0, 7).replace('-', '');
        const existingCount = await tx.invoice.count({
          where: {
            organizationId,
            invoiceNumber: { startsWith: `INV-${yearMonth}-` },
          },
        });
        const sequence = String(existingCount + invoices.length + 1).padStart(4, '0');
        const invoiceNumber = `INV-${yearMonth}-${sequence}`;

        // Calculate line items and total
        const lineItems = clientVisits.map((visit) => {
          let hours = 0;

          // Use actual times if available
          if (visit.actualStart && visit.actualEnd) {
            const start = new Date(visit.actualStart);
            const end = new Date(visit.actualEnd);
            hours = (end - start) / (1000 * 60 * 60);
          } else if (visit.scheduledStart && visit.scheduledEnd) {
            const start = new Date(visit.scheduledStart);
            const end = new Date(visit.scheduledEnd);
            hours = (end - start) / (1000 * 60 * 60);
          } else if (visit.service?.duration) {
            hours = visit.service.duration / 60;
          }

          const rate = visit.service?.rate || 0;
          const amount = hours * rate;

          return {
            description: visit.service?.name || 'Service',
            quantity: 1,
            unitPrice: rate,
            amount: parseFloat(amount.toFixed(2)),
            invoiceId: '', // Will be set after invoice creation
            visitId: visit.id,
            serviceId: visit.service?.id || null,
            hours: parseFloat(hours.toFixed(2)),
          };
        });

        const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

        // Create invoice
        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            amount: parseFloat(totalAmount.toFixed(2)),
            status: 'DRAFT',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            organizationId,
            clientId,
            userId: session.user.id,
            invoiceItems: {
              create: lineItems.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.amount,
                visitId: item.visitId,
                serviceId: item.serviceId,
              })),
            },
          },
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            invoiceItems: true,
          },
        });

        invoices.push({
          ...invoice,
          clientName: `${invoice.client.firstName} ${invoice.client.lastName}`,
          visitCount: clientVisits.length,
        });
      }

      return invoices;
    });

    return NextResponse.json({
      message: `Successfully generated ${generatedInvoices.length} invoices`,
      invoices: generatedInvoices,
    });
  } catch (error) {
    console.error('Error generating batch invoices:', error);
    return NextResponse.json({ error: 'Failed to generate batch invoices' }, { status: 500 });
  }
}
