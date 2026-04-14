import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { VisitReportSchema } from '@/lib/validations';

// GET - Fetch visit reports for a client
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // VISIT_SUMMARY or PERIOD_SUMMARY
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Verify the client belongs to the user's organization
    const client = await prisma.client.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const where = { clientId: id };
    if (type) where.type = type;
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.endDate.lte = new Date(endDate);
    }

    const reports = await prisma.visitReport.findMany({
      where,
      orderBy: { generatedAt: 'desc' },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching visit reports:', error);
    return NextResponse.json({ error: 'Failed to fetch visit reports' }, { status: 500 });
  }
}

// POST - Create a new visit report
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Verify the client belongs to the user's organization
    const client = await prisma.client.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Validate the data
    const validationResult = VisitReportSchema.safeParse({
      ...body,
      clientId: id,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const reportData = {
      clientId: id,
      type: data.type,
      period: data.period || null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      summary: data.summary || null,
      clientCondition: data.clientCondition || null,
      notableEvents: data.notableEvents || null,
      recommendations: data.recommendations || null,
      generatedBy: session.user.id,
      visitIds: data.visitIds || [],
    };

    const report = await prisma.visitReport.create({
      data: reportData,
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error creating visit report:', error);
    return NextResponse.json({ error: 'Failed to create visit report' }, { status: 500 });
  }
}
