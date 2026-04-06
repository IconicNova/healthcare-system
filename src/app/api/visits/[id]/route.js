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
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        carePlan: {
          select: {
            id: true,
            name: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            baseRate: true,
          },
        },
        visitNotes: {
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
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

    const {
      staffId,
      startTime,
      endTime,
      status,
      title,
      description,
      notes,
    } = body;

    // Check if visit exists
    const existing = await prisma.visit.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    // Validate times if provided
    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Check for conflicts if rescheduling
    let conflicts = [];
    if (staffId && (startTime || endTime)) {
      const newStart = startTime ? new Date(startTime) : existing.startTime;
      const newEnd = endTime ? new Date(endTime) : existing.endTime;

      const staffConflicts = await prisma.visit.findMany({
        where: {
          staffId,
          organizationId: session.user.organizationId,
          id: { not: id },
          status: { not: 'CANCELLED' },
          OR: [
            {
              startTime: { lte: newEnd },
              endTime: { gte: newStart },
            },
          ],
        },
      });
      conflicts = staffConflicts.map(v => ({
        type: 'STAFF',
        visitId: v.id,
        startTime: v.startTime,
        endTime: v.endTime,
      }));
    }

    const visit = await prisma.visit.update({
      where: { id },
      data: {
        ...(staffId && { staffId }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(status && { status }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(notes !== undefined && { notes }),
        ...(body.actualStart && { actualStart: new Date(body.actualStart) }),
        ...(body.actualEnd && { actualEnd: new Date(body.actualEnd) }),
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ ...visit, conflicts });
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

    // Check if visit exists
    const existing = await prisma.visit.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    // Cancel the visit instead of deleting
    await prisma.visit.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ message: 'Visit cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling visit:', error);
    return NextResponse.json({ error: 'Failed to cancel visit' }, { status: 500 });
  }
}
