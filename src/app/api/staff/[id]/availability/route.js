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

    // Verify staff belongs to organization
    const staff = await prisma.staff.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    const availability = await prisma.staffAvailability.findMany({
      where: { staffId: id },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        isAvailable: true,
      },
      orderBy: { dayOfWeek: 'asc' },
    });

    // Ensure all 7 days are present
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const availabilityMap = new Map(availability.map(a => [a.dayOfWeek, a]));

    const fullAvailability = daysOfWeek.map((day, index) => {
      const existing = availabilityMap.get(index);
      return existing || {
        id: null,
        dayOfWeek: index,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: false,
      };
    });

    return NextResponse.json(fullAvailability);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const { availability } = body;

    // Validate availability array
    if (!Array.isArray(availability) || availability.length !== 7) {
      return NextResponse.json(
        { error: 'Availability must be an array of 7 days' },
        { status: 400 }
      );
    }

    // Verify staff belongs to organization
    const staff = await prisma.staff.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Upsert all availability records in a transaction
    await prisma.$transaction(async (tx) => {
      const updates = await Promise.all(
        availability.map(async (day) => {
          const { dayOfWeek, startTime, endTime, isAvailable } = day;

          if (dayOfWeek < 0 || dayOfWeek > 6) {
            throw new Error('Invalid dayOfWeek value');
          }

          if (!startTime || !endTime) {
            throw new Error('startTime and endTime are required');
          }

          // Try to update existing record
          const existing = await tx.staffAvailability.findUnique({
            where: {
              staffId_dayOfWeek: {
                staffId: id,
                dayOfWeek,
              },
            },
          });

          if (existing) {
            return tx.staffAvailability.update({
              where: { id: existing.id },
              data: {
                startTime,
                endTime,
                isAvailable,
              },
            });
          } else {
            return tx.staffAvailability.create({
              data: {
                staffId: id,
                dayOfWeek,
                startTime,
                endTime,
                isAvailable,
              },
            });
          }
        })
      );

      return updates;
    });

    // Fetch and return updated availability
    const updatedAvailability = await prisma.staffAvailability.findMany({
      where: { staffId: id },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        isAvailable: true,
      },
      orderBy: { dayOfWeek: 'asc' },
    });

    return NextResponse.json(updatedAvailability);
  } catch (error) {
    console.error('Error updating availability:', error);
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
  }
}
