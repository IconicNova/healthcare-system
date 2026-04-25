import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { requireOrgRole } from '@/lib/api-safety';
import { MedicationSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/audit-log';

// GET - Fetch medications for a client
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

    // Verify the client belongs to the user's organization
    const client = await prisma.client.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        medicalInfo: {
          select: {
            allergies: true,
            conditions: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const medications = await prisma.medication.findMany({
      where: { clientId: id },
      include: {
        _count: {
          select: {
            medAdministrations: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      client,
      medications: medications.map(med => ({
        ...med,
        adminCount: med._count.medAdministrations,
      })),
    });
  } catch (error) {
    console.error('Error fetching client medications:', error);
   return NextResponse.json({ error: 'Failed to fetch client medications' }, { status: 500 });
  }
}

// POST - Create a new medication for a client
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

    const { id: clientId } = params;

    // Verify the client belongs to the user's organization
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        organizationId: session.user.organizationId,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const validationResult = MedicationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const {
      name,
      dosage,
      frequency,
      route,
      administrationType,
      administrationTiming,
      status,
      startDate,
      endDate,
      prescriberName,
      prescriberNPI,
      pharmacyName,
      pharmacyPhone,
      refillCount,
      maxRefills,
      notes,
    } = validationResult.data;

    const medication = await prisma.medication.create({
      data: {
        clientId,
        name,
        dosage,
        frequency,
        route: route || null,
        administrationType: administrationType || null,
        administrationTiming: administrationTiming || null,
        status: status || 'ACTIVE',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        notes: notes || null,
      },
    });

    if (prescriberName || prescriberNPI || pharmacyName || pharmacyPhone || refillCount !== undefined || maxRefills !== undefined) {
      await prisma.medicationOrder.create({
        data: {
          clientId,
          medicationId: medication.id,
          prescriberName: prescriberName || null,
          prescriberNPI: prescriberNPI || null,
          pharmacyName: pharmacyName || null,
          pharmacyPhone: pharmacyPhone || null,
          refillCount: Number.isFinite(refillCount) ? refillCount : 0,
          maxRefills: Number.isFinite(maxRefills) ? maxRefills : null,
          status: status || 'ACTIVE',
        },
      });
    }

    await logAuditEvent({
      organizationId: session.user.organizationId,
      action: 'CREATE',
      entity: 'Medication',
      entityId: medication.id,
      userId: session.user.id,
      after: medication,
    });

    return NextResponse.json(medication, { status: 201 });
  } catch (error) {
    console.error('Error creating medication:', error);
    return NextResponse.json({ error: 'Failed to create medication' }, { status: 500 });
  }
}
