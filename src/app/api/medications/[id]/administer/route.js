import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasRoleAccess } from '@/lib/utils';

// POST - Record medication administration
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only staff-level roles can administer medications
    if (!hasRoleAccess(session.user.role, ['STAFF', 'SUPERVISOR', 'MANAGER', 'ADMIN'])) {
      return NextResponse.json({ error: 'Forbidden: insufficient role for medication administration' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, dosage, unit, reason, comment } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Verify the medication belongs to a client in the user's organization
    const medication = await prisma.medication.findFirst({
      where: {
        id,
        client: {
          organizationId: session.user.organizationId,
        },
      },
    });

    if (!medication) {
      return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
    }

    // Find the staff record for the current user
    const staff = await prisma.staff.findFirst({
      where: {
        userId: session.user.id,
        organizationId: session.user.organizationId,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff record not found for this user' },
        { status: 400 }
      );
    }

    // Create the administration record
    const administration = await prisma.medAdministration.create({
      data: {
        medicationId: id,
        staffId: staff.id,
        administeredAt: new Date(),
        status: status.toUpperCase(),
        dosage: dosage || null,
        unit: unit || null,
        reason: reason || null,
        comment: comment || null,
      },
      include: {
        medication: {
          select: {
            name: true,
            dosage: true,
          },
        },
        staff: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      administration,
      success: true,
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording medication administration:', error);
    return NextResponse.json({ error: 'Failed to record medication administration' }, { status: 500 });
  }
}
