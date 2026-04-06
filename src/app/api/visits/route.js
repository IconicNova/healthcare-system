import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start') || searchParams.get('startDate');
    const endDate = searchParams.get('end') || searchParams.get('endDate');
    const staffId = searchParams.get('staffId');
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');

    const where = {
      organizationId: session.user.organizationId,
    };

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (staffId) {
      where.staffId = staffId;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (status) {
      where.status = status;
    }

    const visits = await prisma.visit.findMany({
      where,
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
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(visits);
  } catch (error) {
    console.error('Error fetching visits:', error);
    return NextResponse.json({ error: 'Failed to fetch visits' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const {
      clientId,
      staffId,
      carePlanId,
      serviceId,
      branchId,
      startTime,
      endTime,
      status,
      title,
      description,
      notes,
      recurrence,
    } = body;

    // Validate required fields
    if (!clientId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Client, start time, and end time are required' },
        { status: 400 }
      );
    }

    if (new Date(endTime) <= new Date(startTime)) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Check for staff availability conflict
    let conflicts = [];
    if (staffId) {
      const staffConflicts = await prisma.visit.findMany({
        where: {
          staffId,
          organizationId: session.user.organizationId,
          status: { not: 'CANCELLED' },
          OR: [
            {
              startTime: { lte: new Date(endTime) },
              endTime: { gte: new Date(startTime) },
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

    // Create visit
    const visit = await prisma.visit.create({
      data: {
        clientId,
        staffId: staffId || null,
        carePlanId: carePlanId || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: status || 'SCHEDULED',
        title: title || null,
        description: description || null,
        notes: notes || null,
        organizationId: session.user.organizationId,
        branchId: branchId || null,
        userId: session.user.id,
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

    // Handle recurrence
    if (recurrence && recurrence.type && recurrence.type !== 'NONE') {
      const occurrences = [];
      const baseStart = new Date(startTime);
      const duration = new Date(endTime) - new Date(startTime);

      if (recurrence.type === 'DAILY' && recurrence.count) {
        for (let i = 1; i < recurrence.count; i++) {
          const newStart = new Date(baseStart);
          newStart.setDate(newStart.getDate() + i);
          const newEnd = new Date(newStart.getTime() + duration);

          const recurringVisit = await prisma.visit.create({
            data: {
              clientId,
              staffId: staffId || null,
              carePlanId: carePlanId || null,
              startTime: newStart,
              endTime: newEnd,
              status: status || 'SCHEDULED',
              title: title || null,
              description: description || null,
              notes: notes || null,
              organizationId: session.user.organizationId,
              branchId: branchId || null,
              userId: session.user.id,
            },
          });
          occurrences.push(recurringVisit.id);
        }
      } else if (recurrence.type === 'WEEKLY' && recurrence.weeks) {
        for (let i = 1; i < recurrence.weeks; i++) {
          const newStart = new Date(baseStart);
          newStart.setDate(newStart.getDate() + (i * 7));
          const newEnd = new Date(newStart.getTime() + duration);

          const recurringVisit = await prisma.visit.create({
            data: {
              clientId,
              staffId: staffId || null,
              carePlanId: carePlanId || null,
              startTime: newStart,
              endTime: newEnd,
              status: status || 'SCHEDULED',
              title: title || null,
              description: description || null,
              notes: notes || null,
              organizationId: session.user.organizationId,
              branchId: branchId || null,
              userId: session.user.id,
            },
          });
          occurrences.push(recurringVisit.id);
        }
      }
    }

    return NextResponse.json({
      ...visit,
      conflicts,
      recurringOccurrences: occurrences,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating visit:', error);
    return NextResponse.json({ error: 'Failed to create visit' }, { status: 500 });
  }
}
