import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST - Check for drug interactions
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { medications } = body;

    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return NextResponse.json(
        { error: 'Medications array is required' },
        { status: 400 }
      );
    }

    // Get all drug interactions from database
    const allInteractions = await prisma.drugInteraction.findMany();

    // Check for interactions
    const interactions = checkInteractions(medications, allInteractions);

    return NextResponse.json({ interactions });
  } catch (error) {
    console.error('Error checking drug interactions:', error);
    return NextResponse.json({ error: 'Failed to check drug interactions' }, { status: 500 });
  }
}

// Helper: Check medications for interactions
function checkInteractions(medications, interactions) {
  const medicationNames = medications.map(m => normalizeName(m.name));
  const foundInteractions = [];

  for (const interaction of interactions) {
    const drug1Match = medicationNames.includes(normalizeName(interaction.drug1));
    const drug2Match = medicationNames.includes(normalizeName(interaction.drug2));

    if (drug1Match && drug2Match) {
      foundInteractions.push({
        drug1: interaction.drug1,
        drug2: interaction.drug2,
        severity: interaction.severity,
        description: interaction.description,
        recommendation: interaction.recommendation,
      });
    }
  }

  return foundInteractions;
}

// Helper: Normalize drug name
function normalizeName(name) {
  return name.toLowerCase().trim();
}
