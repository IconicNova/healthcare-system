import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { parsePaginationParams } from '@/lib/api-safety';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePaginationParams(searchParams, { defaultLimit: 10 });
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where = {
      organizationId: session.user.organizationId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          client: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (status === 'active') {
      where.status = true;
    } else if (status === 'inactive') {
      where.status = false;
    }

    const [carePlans, total] = await Promise.all([
      prisma.carePlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          clientId: true,
          staffId: true,
          startDate: true,
          endDate: true,
          status: true,
          client: { select: { firstName: true, lastName: true, city: true } },
          staff: { select: { firstName: true, lastName: true } },
          services: {
            select: {
              serviceId: true,
              frequency: true,
              frequencyText: true,
              instructions: true,
              service: { select: { id: true, name: true, duration: true } },
            },
            orderBy: { order: 'asc' },
          },
        },
      }),
      prisma.carePlan.count({ where }),
    ]);

    return NextResponse.json({
      carePlans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching care plans:', error);
    return NextResponse.json({ error: 'Failed to fetch care plans' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, startDate, endDate, status, clientId, staffId, services } = body;

    if (!name || !clientId || !startDate) {
      return NextResponse.json(
        { error: 'Name, client, and start date are required' },
        { status: 400 }
      );
    }

    if (endDate && new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Validate that all services have a serviceId
    if (services && services.length > 0) {
      const invalidServices = services.filter(s => !s.serviceId);
      if (invalidServices.length > 0) {
        return NextResponse.json(
          { error: 'All services must have a valid service selected' },
          { status: 400 }
        );
      }

      // Check for duplicate services
      const serviceIdSet = new Set(services.map(s => s.serviceId));
      if (serviceIdSet.size !== services.length) {
        return NextResponse.json(
          { error: 'Duplicate services are not allowed in a care plan' },
          { status: 400 }
        );
      }
    }

    const carePlan = await prisma.carePlan.create({
      data: {
        name,
        description: description || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status !== false,
        organizationId: session.user.organizationId,
        clientId,
        staffId: staffId || null,
        services: services && services.length > 0 ? {
          create: services.map(s => ({
            serviceId: s.serviceId,
            frequency: s.frequency || 'AS_NEEDED',
            frequencyText: s.frequencyText || null,
            instructions: s.instructions || null,
            order: s.order || 0,
          })),
        } : undefined,
      },
      include: {
        client: { select: { firstName: true, lastName: true } },
        staff: { select: { firstName: true, lastName: true } },
        services: {
          include: {
            service: { select: { id: true, name: true, duration: true, baseRate: true } },
          },
        },
      },
    });

    return NextResponse.json(carePlan, { status: 201 });
  } catch (error) {
    console.error('Error creating care plan:', error);
    return NextResponse.json({ error: 'Failed to create care plan' }, { status: 500 });
  }
}
