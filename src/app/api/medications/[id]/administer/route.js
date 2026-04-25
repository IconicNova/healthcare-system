import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hasRoleAccess } from '@/lib/utils';
import { buildMedicationAdministrationPayload } from '@/components/care-delivery/medication-administration.helpers';
import { enforceRouteRateLimit } from '@/lib/route-rate-limit';
import { logAuditEvent } from '@/lib/audit-log';

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

    const rateLimitResponse = await enforceRouteRateLimit(session, 'medication-administer', {
      maxRequests: 60,
      windowMs: 15 * 60 * 1000,
      message: 'Too many medication administration attempts. Please try again later.',
    });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { id } = params;
    const body = await request.json();
    let administrationData;
    try {
      administrationData = buildMedicationAdministrationPayload(body);
    } catch (error) {
      return NextResponse.json(
        { error: error.message || 'Invalid medication administration data' },
        { status: 400 }
      );
    }

    const { status, dosage, unit, reason, comment, visitId } = administrationData;

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

    const visit = await prisma.visit.findFirst({
      where: {
        id: visitId,
        clientId: medication.clientId,
        organizationId: session.user.organizationId,
      },
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found for this medication administration' }, { status: 404 });
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
        visitId,
        staffId: staff.id,
        administeredAt: new Date(),
        status,
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
        visit: {
          select: {
            id: true,
            title: true,
            startTime: true,
            service: {
              select: {
                name: true,
              },
            },
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

    await logAuditEvent({
      action: 'ADMINISTER',
      entity: 'MedAdministration',
      entityId: administration.id,
      userId: session.user.id,
      after: administration,
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
