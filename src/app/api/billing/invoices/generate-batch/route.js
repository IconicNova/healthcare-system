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
      status: { in: ['COMPLETED', 'APPROVED'] },
      invoiceItems: { none: {} }, // Not yet invoiced (no invoice items associated)
      clientId: { in: clientIds },
    };

    // Add date range if provided
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(endDate);
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
            baseRate: true,
            duration: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
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
        // Re-check visits inside transaction to prevent duplicate invoice items
        // This ensures no invoice items were created between our initial query and now
        const visitIds = clientVisits.map(v => v.id);
        const visitsWithNoInvoiceItems = await tx.visit.findMany({
          where: {
            id: { in: visitIds },
            invoiceItems: { none: {} }, // Ensure still no invoice items
          },
        });

        // Filter to only visits that still have no invoice items
        const validVisitIds = new Set(visitsWithNoInvoiceItems.map(v => v.id));
        const validVisits = clientVisits.filter(v => validVisitIds.has(v.id));

        if (validVisits.length === 0) {
          continue; // Skip this client if all visits are already invoiced
        }
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
        const lineItems = validVisits.map((visit) => {
          let hours = 0;

          // Priority 1: Use actual times if both available
          if (visit.actualStart && visit.actualEnd) {
            const start = new Date(visit.actualStart);
            const end = new Date(visit.actualEnd);
            hours = (end - start) / (1000 * 60 * 60);
          } else if (visit.startTime && visit.endTime) {
            // Priority 2: Use scheduled times if both available
            const start = new Date(visit.startTime);
            const end = new Date(visit.endTime);
            hours = (end - start) / (1000 * 60 * 60);
          } else if (visit.service?.duration) {
            // Priority 3: Use service duration if available
            hours = visit.service.duration / 60;
          }

          const rate = visit.service?.baseRate || 0;
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
          visitCount: validVisits.length,
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
