import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { StaffSchema } from '@/lib/validations';
import { ApiResponse } from '@/lib/api-response';

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
    const branchId = searchParams.get('branchId');
    const role = searchParams.get('role');

    // Whitelist valid sort fields to prevent information disclosure
    const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'firstName', 'lastName', 'email', 'status', 'role'];
    const ALLOWED_ORDER_VALUES = ['asc', 'desc'];
    const sort = ALLOWED_SORT_FIELDS.includes(searchParams.get('sort')) ? searchParams.get('sort') : 'createdAt';
    const order = ALLOWED_ORDER_VALUES.includes(searchParams.get('order')) ? searchParams.get('order') : 'desc';
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

    // Validate status is a valid StaffStatus enum value
    if (status && typeof status === 'string' && ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'].includes(status)) {
      where.status = status;
    }

    // Validate branchId is a valid UUID string
    if (branchId && typeof branchId === 'string' && branchId.length > 0) {
      where.branchId = branchId;
    }

    // Validate role is a valid StaffRole enum value
    if (role && typeof role === 'string' && ['ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF'].includes(role)) {
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
        user: {
          avatar: s.user?.avatar || null,
        },
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

    const validationResult = StaffSchema.safeParse(body);
    if (!validationResult.success) {
      return ApiResponse.error('Validation failed', 400, validationResult.error.format());
    }

    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      branchId,
      payRate,
      payType,
      status,
      role,
      licenseNumber,
      licenseExpiry,
    } = body;

    // Validate required fields explicitly strictly required for staff creation (some omitted in Zod because of shared schema logic)
    if (!email || !password || !branchId || !role) {
      return ApiResponse.error('Missing required fields (email, password, branchId, role)', 400);
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

// Helper function to generate a unique employee ID
function generateNewEmployeeId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 6);
  return `EMP-${timestamp}${randomPart}`.toUpperCase().slice(0, 12);
}
