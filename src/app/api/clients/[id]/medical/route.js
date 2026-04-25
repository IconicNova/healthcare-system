import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Check if client exists
    const client = await prisma.client.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { medications, medicalHistory } = body;

    // Update medications
    if (medications) {
      // Delete existing medications
      await prisma.medication.deleteMany({
        where: { clientId: id },
      });

      // Create new medications
      if (medications.length > 0) {
        await prisma.medication.createMany({
          data: medications.map(med => ({
            clientId: id,
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            notes: med.notes || null,
          })),
        });
      }
    }

    // Update medical history
    if (medicalHistory) {
      // Delete existing medical history
      await prisma.medicalHistory.deleteMany({
        where: { clientId: id },
      });

      // Create new medical history
      if (medicalHistory.length > 0) {
        await prisma.medicalHistory.createMany({
          data: medicalHistory.map(history => ({
            clientId: id,
            condition: history.condition,
            diagnosis: history.diagnosis || null,
            date: history.date ? new Date(history.date) : null,
            notes: history.notes || null,
          })),
        });
      }
    }

    // Return updated client with medical info
    const updatedClient = await prisma.client.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        medications: {
          select: {
            id: true,
            name: true,
            dosage: true,
            frequency: true,
            notes: true,
          },
        },
        medicalHistory: {
          select: {
            id: true,
            condition: true,
            diagnosis: true,
            date: true,
            notes: true,
          },
        },
      },
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Error updating medical info:', error);
    return NextResponse.json({ error: 'Failed to update medical info' }, { status: 500 });
  }
}
