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

    const visit = await prisma.visit.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            phone: true,
            email: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            role: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            baseRate: true,
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
        medAdministrations: {
          select: {
            id: true,
            dosage: true,
            administeredAt: true,
            status: true,
          },
        },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    return NextResponse.json(visit);
  } catch (error) {
    console.error('Error fetching visit:', error);
    return NextResponse.json({ error: 'Failed to fetch visit' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const existing = await prisma.visit.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    const visit = await prisma.visit.update({
      where: { id },
      data: {
        ...(body.startTime && { startTime: new Date(body.startTime) }),
        ...(body.endTime && { endTime: new Date(body.endTime) }),
        ...(body.status && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.clientId && { clientId: body.clientId }),
        ...(body.staffId !== undefined && { staffId: body.staffId }),
        ...(body.serviceId && { serviceId: body.serviceId }),
        ...(body.carePlanId && { carePlanId: body.carePlanId }),
        ...(body.branchId !== undefined && { branchId: body.branchId }),
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            address: true,
            city: true,
            state: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
          },
        },
      },
    });

    return NextResponse.json(visit);
  } catch (error) {
    console.error('Error updating visit:', error);
    return NextResponse.json({ error: 'Failed to update visit' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const existing = await prisma.visit.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    await prisma.visit.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('Error deleting visit:', error);
    return NextResponse.json({ error: 'Failed to delete visit' }, { status: 500 });
  }
}
