import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { pickAllowedFields, requireClinicalRole } from '@/lib/api-safety';

const ALLOWED_VITAL_FIELDS = [
  'temperature',
  'temperatureUnit',
  'bloodPressureSystolic',
  'bloodPressureDiastolic',
  'heartRate',
  'respiratoryRate',
  'oxygenSaturation',
  'painLevel',
  'weight',
  'weightUnit',
  'height',
  'heightUnit',
  'bmi',
  'glucose',
  'glucoseUnit',
  'recordedAt',
  'notes',
];

function buildVitalPatch(body) {
  const allowed = pickAllowedFields(body, ALLOWED_VITAL_FIELDS);
  if (allowed.recordedAt !== undefined) {
    const recordedAt = allowed.recordedAt ? new Date(allowed.recordedAt) : null;
    if (recordedAt && Number.isNaN(recordedAt.getTime())) {
      return { error: 'Invalid recorded date' };
    }
    allowed.recordedAt = recordedAt;
  }

  return {
    data: allowed,
  };
}

// GET - Fetch a single vital sign entry
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

    const vital = await prisma.vitalSign.findFirst({
      where: {
        id,
        client: {
          organizationId: session.user.organizationId,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        visit: {
          select: {
            id: true,
            startTime: true,
          },
        },
      },
    });

    if (!vital) {
      return NextResponse.json({ error: 'Vital sign not found' }, { status: 404 });
    }

    return NextResponse.json(vital);
  } catch (error) {
    console.error('Error fetching vital sign:', error);
    return NextResponse.json({ error: 'Failed to fetch vital sign' }, { status: 500 });
  }
}

// PATCH - Update a vital sign entry
export async function PATCH(request, { params }) {
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
    const body = await request.json();

    const vital = await prisma.vitalSign.findFirst({
      where: {
        id,
        client: {
          organizationId: session.user.organizationId,
        },
      },
    });

    if (!vital) {
      return NextResponse.json({ error: 'Vital sign not found' }, { status: 404 });
    }

    const vitalPatch = buildVitalPatch(body);
    if (vitalPatch.error) {
      return NextResponse.json({ error: vitalPatch.error }, { status: 400 });
    }

    const updatedVital = await prisma.vitalSign.update({
      where: { id },
      data: vitalPatch.data,
    });

    return NextResponse.json(updatedVital);
  } catch (error) {
    console.error('Error updating vital sign:', error);
    return NextResponse.json({ error: 'Failed to update vital sign' }, { status: 500 });
  }
}

// DELETE - Delete a vital sign entry
export async function DELETE(request, { params }) {
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

    const vital = await prisma.vitalSign.findFirst({
      where: {
        id,
        client: {
          organizationId: session.user.organizationId,
        },
      },
    });

    if (!vital) {
      return NextResponse.json({ error: 'Vital sign not found' }, { status: 404 });
    }

    await prisma.vitalSign.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vital sign:', error);
    return NextResponse.json({ error: 'Failed to delete vital sign' }, { status: 500 });
  }
}
