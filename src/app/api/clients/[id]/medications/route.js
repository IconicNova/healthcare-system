import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { requireClinicalRole } from '@/lib/api-safety';

// GET - Fetch medications for a client
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forbiddenResponse = requireClinicalRole(session);
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

    const forbiddenResponse = requireClinicalRole(session);
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
    const { name, dosage, frequency, notes } = body;

    if (!name || !dosage || !frequency) {
      return NextResponse.json({ error: 'Name, dosage, and frequency are required' }, { status: 400 });
    }

    const medication = await prisma.medication.create({
      data: {
        clientId,
        name,
        dosage,
        frequency,
        notes: notes || null,
      },
    });

    return NextResponse.json(medication, { status: 201 });
  } catch (error) {
    console.error('Error creating medication:', error);
    return NextResponse.json({ error: 'Failed to create medication' }, { status: 500 });
  }
}
