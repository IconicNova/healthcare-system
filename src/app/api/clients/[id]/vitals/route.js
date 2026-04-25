import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { VitalSignSchema } from '@/lib/validations';
import { parsePaginationParams } from '@/lib/api-safety';
import { requireOrgRole } from '@/lib/api-safety';
import { logAuditEvent } from '@/lib/audit-log';

// GET - Fetch vitals for a client
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forbiddenResponse = requireOrgRole(session, ['STAFF']);
    if (forbiddenResponse) {
      return forbiddenResponse;
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const { limit } = parsePaginationParams(searchParams, { defaultLimit: 50 });
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
    if (startDate || endDate) {
      where.recordedAt = {};
      if (startDate) where.recordedAt.gte = new Date(startDate);
      if (endDate) where.recordedAt.lte = new Date(endDate);
    }

    const vitals = await prisma.vitalSign.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: limit,
      include: {
        visit: {
          select: {
            id: true,
            startTime: true,
          },
        },
      },
    });

    return NextResponse.json({ vitals });
  } catch (error) {
    console.error('Error fetching vitals:', error);
    return NextResponse.json({ error: 'Failed to fetch vitals' }, { status: 500 });
  }
}

// POST - Create a new vital sign entry
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forbiddenResponse = requireOrgRole(session, ['STAFF']);
    if (forbiddenResponse) {
      return forbiddenResponse;
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
    const validationResult = VitalSignSchema.safeParse({
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
    const vitalData = {
      clientId: id,
      temperature: data.temperature ?? null,
      temperatureUnit: data.temperatureUnit || 'F',
      bloodPressureSystolic: data.bloodPressureSystolic ?? null,
      bloodPressureDiastolic: data.bloodPressureDiastolic ?? null,
      heartRate: data.heartRate ?? null,
      respiratoryRate: data.respiratoryRate ?? null,
      oxygenSaturation: data.oxygenSaturation ?? null,
      painLevel: data.painLevel ?? null,
      weight: data.weight ?? null,
      weightUnit: data.weightUnit || 'lbs',
      height: data.height ?? null,
      heightUnit: data.heightUnit || 'in',
      bmi: data.bmi ?? null,
      glucose: data.glucose ?? null,
      glucoseUnit: data.glucoseUnit || 'mg/dL',
      visitId: data.visitId || null,
      recordedBy: session.user.id,
      notes: body.notes || null,
    };

    if (data.recordedAt) {
      vitalData.recordedAt = new Date(data.recordedAt);
    }

    const vital = await prisma.vitalSign.create({
      data: vitalData,
    });

    await logAuditEvent({
      organizationId: session.user.organizationId,
      action: 'CREATE',
      entity: 'VitalSign',
      entityId: vital.id,
      userId: session.user.id,
      after: vital,
    });

    return NextResponse.json(vital, { status: 201 });
  } catch (error) {
    console.error('Error creating vital sign:', error);
    return NextResponse.json({ error: 'Failed to create vital sign' }, { status: 500 });
  }
}
