import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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
    const status = searchParams.get('status') || '';
    const branchId = searchParams.get('branchId') || '';
    const role = searchParams.get('role') || '';
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
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
      ];
    }

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (role) {
      where.role = role;
    }

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
        include: {
          user: {
            select: {
              avatar: true,
            },
          },
          branch: {
            select: {
              name: true,
            },
          },
          skills: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
          certifications: {
            select: {
              id: true,
              name: true,
              expiryDate: true,
            },
          },
          _count: {
            select: {
              visits: true,
              timesheets: true,
            },
          },
        },
      }),
      prisma.staff.count({ where }),
    ]);

    return NextResponse.json({
      staff: staff.map(s => ({
        ...s,
        fullName: `${s.firstName} ${s.lastName}`,
        avatar: s.user?.avatar || null,
        employeeId: generateEmployeeId(s.createdAt),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
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
      email,
      password,
      phone,
      address,
      branchId,
      hireDate,
      payRate,
      payType,
      status,
      role,
      licenseNumber,
      licenseExpiry,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phone || !branchId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role - never allow ADMIN creation through API
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot create ADMIN or SUPER_ADMIN users through API' },
        { status: 403 }
      );
    }

    // Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Check for duplicate staff email
    const existingStaff = await prisma.staff.findUnique({
      where: { email },
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: 'Staff with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate employee ID
    const employeeId = generateNewEmployeeId();

    // Create User and Staff in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: role,
          status: true,
          organizationId: session.user.organizationId,
          branchId: branchId || null,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          createdAt: true,
        },
      });

      const staff = await tx.staff.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          address: address || null,
          role,
          payType: payType || 'HOURLY',
          hourlyRate: payRate || null,
          status: status || 'INACTIVE',
          licenseNumber: licenseNumber || null,
          licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
          organizationId: session.user.organizationId,
          branchId: branchId || null,
          userId: user.id,
          employeeId,
        },
        include: {
          user: {
            select: {
              avatar: true,
            },
          },
          branch: {
            select: {
              name: true,
            },
          },
          skills: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
          certifications: {
            select: {
              id: true,
              name: true,
              issuedBy: true,
              issueDate: true,
              expiryDate: true,
            },
          },
        },
      });

      return { user, staff };
    });

    return NextResponse.json({
      ...result.staff,
      user: result.user,
      fullName: `${result.staff.firstName} ${result.staff.lastName}`,
      employeeId: result.staff.employeeId,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 });
  }
}

// Helper function to generate employee ID
function generateNewEmployeeId() {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `EMP-${randomNum}`;
}

// Helper function to derive employee ID from createdAt (for existing records without employeeId)
function generateEmployeeId(createdAt) {
  const date = new Date(createdAt);
  const timestamp = date.getTime().toString().slice(-6);
  return `EMP-${timestamp}`;
}
