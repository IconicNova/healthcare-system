import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where: {
          clientId: id,
        },
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          carePlan: {
            select: {
              id: true,
              name: true,
            },
          },
          visitTasks: {
            select: {
              id: true,
              title: true,
              completed: true,
              notes: true,
            },
          },
          visitNotes: {
            select: {
              id: true,
              content: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.visit.count({
        where: { clientId: id },
      }),
    ]);

    return NextResponse.json({
      visits: visits.map(visit => ({
        ...visit,
        staffName: visit.staff ? `${visit.staff.firstName} ${visit.staff.lastName}` : null,
        carePlanName: visit.carePlan?.name || null,
        completedTasks: visit.visitTasks.filter(t => t.completed).length,
        totalTasks: visit.visitTasks.length,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching client visits:', error);
    return NextResponse.json({ error: 'Failed to fetch client visits' }, { status: 500 });
  }
}
