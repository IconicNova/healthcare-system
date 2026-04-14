import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST - Medication reconciliation: compare and merge medication lists
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { externalMedications, action = 'compare' } = body;

    // Verify the client belongs to the user's organization
    const client = await prisma.client.findFirst({
      where: {
        id: String(id),
        organizationId: session.user.organizationId,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get current medications
    const currentMedications = await prisma.medication.findMany({
      where: { clientId: id },
    });

    // Compare medication lists
    const comparison = compareMedicationLists(currentMedications, externalMedications);

    if (action === 'merge') {
      // Merge external medications into the system
      const merged = await mergeMedications(id, currentMedications, externalMedications, session.user.id);
      return NextResponse.json({
        action: 'merged',
        merged,
        comparison,
      });
    }

    return NextResponse.json({
      action: 'compared',
      current: currentMedications,
      external: externalMedications,
      comparison,
    });
  } catch (error) {
    console.error('Error reconciling medications:', error);
    return NextResponse.json({ error: 'Failed to reconcile medications' }, { status: 500 });
  }
}

// Helper: Compare two medication lists
function compareMedicationLists(current, external) {
  const currentNames = new Set(current.map(m => normalizeMedicationName(m.name)));
  const externalNames = new Set(external.map(m => normalizeMedicationName(m.name)));

  const added = external.filter(m => !currentNames.has(normalizeMedicationName(m.name)));
  const discontinued = current.filter(m => !externalNames.has(normalizeMedicationName(m.name)));
  const unchanged = current.filter(m => externalNames.has(normalizeMedicationName(m.name)));
  const potentiallyChanged = [];

  // Check for potential changes (same name, different details)
  for (const extMed of external) {
    const extName = normalizeMedicationName(extMed.name);
    const currentMed = current.find(m => normalizeMedicationName(m.name) === extName);
    if (currentMed && (currentMed.dosage !== extMed.dosage || currentMed.frequency !== extMed.frequency)) {
      potentiallyChanged.push({
        medication: currentMed,
        externalVersion: extMed,
        changes: getChanges(currentMed, extMed),
      });
    }
  }

  return {
    added: added.length,
    discontinued: discontinued.length,
    unchanged: unchanged.length,
    potentiallyChanged: potentiallyChanged.length,
    details: {
      added,
      discontinued,
      potentiallyChanged,
    },
  };
}

// Helper: Merge external medications
async function mergeMedications(clientId, current, external) {
  const merged = { added: [], updated: [], unchanged: [] };

  for (const extMed of external) {
    const existing = current.find(m => normalizeMedicationName(m.name) === normalizeMedicationName(extMed.name));

    if (!existing) {
      // Add new medication
      const newMed = await prisma.medication.create({
        data: {
          clientId,
          name: extMed.name,
          dosage: extMed.dosage || '',
          frequency: extMed.frequency || '',
          route: extMed.route || null,
          administrationType: extMed.administrationType || null,
          administrationTiming: extMed.administrationTiming || null,
          status: extMed.status || 'ACTIVE',
          startDate: extMed.startDate ? new Date(extMed.startDate) : null,
          endDate: extMed.endDate ? new Date(extMed.endDate) : null,
          notes: extMed.notes || null,
        },
      });
      merged.added.push(newMed);
    } else if (existing.dosage !== extMed.dosage || existing.frequency !== extMed.frequency) {
      // Update changed medication
      const updatedMed = await prisma.medication.update({
        where: { id: existing.id },
        data: {
          dosage: extMed.dosage || '',
          frequency: extMed.frequency || '',
          notes: extMed.notes || existing.notes,
        },
      });
      merged.updated.push(updatedMed);
    } else {
      merged.unchanged.push(existing);
    }
  }

  return merged;
}

// Helper: Normalize medication name for comparison
function normalizeMedicationName(name) {
  return name.toLowerCase().trim();
}

// Helper: Get changes between two medication records
function getChanges(current, external) {
  const changes = [];
  if (current.dosage !== external.dosage) {
    changes.push({ field: 'dosage', old: current.dosage, new: external.dosage });
  }
  if (current.frequency !== external.frequency) {
    changes.push({ field: 'frequency', old: current.frequency, new: external.frequency });
  }
  if (current.route !== external.route) {
    changes.push({ field: 'route', old: current.route, new: external.route });
  }
  return changes;
}
