import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasRoleAccess } from '@/lib/utils';

// GET - List insurance claims with filtering
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER', 'SUPERVISOR'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const organizationId = session.user.organizationId;
    const skip = (page - 1) * limit;

    const where = { organizationId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { claimNumber: { contains: search, mode: 'insensitive' } },
        { client: { firstName: { contains: search, mode: 'insensitive' } } },
        { client: { lastName: { contains: search, mode: 'insensitive' } } },
        { insuranceType: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (dateFrom || dateTo) {
      where.serviceDate = {};
      if (dateFrom) where.serviceDate.gte = new Date(dateFrom);
      if (dateTo) where.serviceDate.lte = new Date(dateTo);
    }

    const [claims, total] = await Promise.all([
      prisma.insuranceClaim.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.insuranceClaim.count({ where }),
    ]);

    const formattedClaims = claims.map((claim) => ({
      id: claim.id,
      claimNumber: claim.claimNumber,
      clientName: `${claim.client.firstName} ${claim.client.lastName}`,
      clientId: claim.clientId,
      insuranceType: claim.insuranceType,
      insuranceId: claim.insuranceId,
      invoiceNumber: claim.invoice.invoiceNumber,
      invoiceId: claim.invoiceId,
      invoiceAmount: claim.invoice.amount,
      diagnosisCode: claim.diagnosisCode,
      authorizationNumber: claim.authorizationNumber,
      serviceDate: claim.serviceDate,
      amount: claim.amount,
      approvedAmount: claim.approvedAmount,
      status: claim.status,
      submittedDate: claim.submittedDate,
      responseDate: claim.responseDate,
      denialReason: claim.denialReason,
      notes: claim.notes,
      createdAt: claim.createdAt,
    }));

    return NextResponse.json({
      claims: formattedClaims,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching insurance claims:', error);
    return NextResponse.json({ error: 'Failed to fetch insurance claims' }, { status: 500 });
  }
}

// POST - Create a new insurance claim
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { invoiceId, diagnosisCode, authorizationNumber, notes } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice is required' }, { status: 400 });
    }

    const organizationId = session.user.organizationId;

    // Get the invoice with client info
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, organizationId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            insuranceType: true,
            insuranceId: true,
          },
        },
        invoiceItems: {
          select: { visitId: true },
          take: 1,
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (!invoice.client.insuranceType || !invoice.client.insuranceId) {
      return NextResponse.json({
        error: 'Client does not have insurance information. Please update the client profile first.',
      }, { status: 400 });
    }

    // Check if a claim already exists for this invoice
    const existingClaim = await prisma.insuranceClaim.findFirst({
      where: { invoiceId, organizationId },
    });

    if (existingClaim) {
      return NextResponse.json({
        error: 'A claim already exists for this invoice',
      }, { status: 409 });
    }

    // Generate claim number
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const claimCount = await prisma.insuranceClaim.count({ where: { organizationId } });
    const claimNumber = `CLM-${yearMonth}-${String(claimCount + 1).padStart(4, '0')}`;

    const claim = await prisma.insuranceClaim.create({
      data: {
        claimNumber,
        invoiceId,
        clientId: invoice.clientId,
        insuranceType: invoice.client.insuranceType,
        insuranceId: invoice.client.insuranceId,
        diagnosisCode: diagnosisCode || null,
        authorizationNumber: authorizationNumber || null,
        serviceDate: invoice.createdAt,
        amount: invoice.amount,
        status: 'PENDING',
        notes: notes || null,
        organizationId,
      },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
        invoice: {
          select: { id: true, invoiceNumber: true, amount: true },
        },
      },
    });

    return NextResponse.json({ claim }, { status: 201 });
  } catch (error) {
    console.error('Error creating insurance claim:', error);
    return NextResponse.json({ error: 'Failed to create insurance claim' }, { status: 500 });
  }
}
