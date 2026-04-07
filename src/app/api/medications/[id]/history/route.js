import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch medication administration history
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

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

    const [history, total] = await Promise.all([
      prisma.medAdministration.findMany({
        where: { medicationId: id },
        skip,
        take: limit,
        orderBy: { administeredAt: 'desc' },
        include: {
          staff: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          visit: {
            select: {
              title: true,
              startTime: true,
            },
          },
        },
      }),
      prisma.medAdministration.count({ where: { medicationId: id } }),
    ]);

    return NextResponse.json({
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching medication history:', error);
    return NextResponse.json({ error: 'Failed to fetch medication history' }, { status: 500 });
  }
}
