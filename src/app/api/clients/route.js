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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    const where = {
      organizationId: session.user.organizationId,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Validate status is a valid ClientStatus enum value
    if (status && typeof status === 'string' && ['ACTIVE', 'INACTIVE', 'PENDING', 'ON_HOLD', 'DISCHARGED'].includes(status)) {
      where.status = status;
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          status: true,
          dateOfBirth: true,
          gender: true,
          insuranceType: true,
          insuranceId: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              carePlans: true,
              visits: true,
            },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json({
      clients: clients.map(client => ({
        ...client,
        fullName: `${client.firstName} ${client.lastName}`,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
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
      firstName,
      lastName,
      dateOfBirth,
      gender,
      ssn,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      status,
      insuranceType,
      insuranceId,
      branchId,
      emergencyContacts,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !phone || !address || !city || !state || !zipCode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate date of birth if provided (prevent wildly invalid years like +020004)
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const year = dob.getFullYear();
      if (isNaN(dob.getTime()) || year < 1900 || year > new Date().getFullYear()) {
        return NextResponse.json(
          { error: 'Invalid date of birth. Please enter a valid date.' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate email if provided
    if (email) {
      const existing = await prisma.client.findFirst({
        where: {
          organizationId: session.user.organizationId,
          email,
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        ssn,
        email: email || null,
        phone,
        address,
        city,
        state,
        zipCode,
        status: status || 'PENDING',
        insuranceType,
        insuranceId,
        organizationId: session.user.organizationId,
        branchId: branchId || null,
        emergencyContacts: emergencyContacts?.length
          ? {
              create: emergencyContacts.map(contact => ({
                name: contact.name,
                relation: contact.relation,
                phone: contact.phone,
                email: contact.email || null,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        status: true,
        dateOfBirth: true,
        gender: true,
        ssn: true,
        insuranceType: true,
        insuranceId: true,
        createdAt: true,
        emergencyContacts: {
          select: {
            id: true,
            name: true,
            relation: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
