import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch medications for a client
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
