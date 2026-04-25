import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { CreateStaffSchema } from '@/lib/validations';
import { ApiResponse } from '@/lib/api-response';
import { getUserStatusFromStaffStatus } from '@/lib/clients-staff-review.mjs';
import { canManageStaffRole, parsePaginationParams, requireRole } from '@/lib/api-safety';
import { logAuditEvent } from '@/lib/audit-log';

const STAFF_MUTATION_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePaginationParams(searchParams, { defaultLimit: 10 });
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');
    const role = searchParams.get('role');

    // Whitelist valid sort fields to prevent information disclosure
    const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'firstName', 'lastName', 'email', 'status', 'role'];
    const ALLOWED_ORDER_VALUES = ['asc', 'desc'];
    const sort = ALLOWED_SORT_FIELDS.includes(searchParams.get('sort')) ? searchParams.get('sort') : 'createdAt';
    const order = ALLOWED_ORDER_VALUES.includes(searchParams.get('order')) ? searchParams.get('order') : 'desc';
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

    const forbiddenResponse = requireRole(session, STAFF_MUTATION_ROLES);
    if (forbiddenResponse) {
      return forbiddenResponse;
    }

    const body = await request.json();

    const validationResult = CreateStaffSchema.safeParse(body);
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
      hireDate,
    } = validationResult.data;
    const nextStaffStatus = status || 'INACTIVE';

    if (!canManageStaffRole(session.user.role, role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check for duplicate email within organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        organizationId: session.user.organizationId,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Check for duplicate staff email within organization
    const existingStaff = await prisma.staff.findFirst({
      where: {
        email,
        organizationId: session.user.organizationId,
      },
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
          status: getUserStatusFromStaffStatus(nextStaffStatus),
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
          status: nextStaffStatus,
          licenseNumber: licenseNumber || null,
          licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
          hireDate: hireDate ? new Date(hireDate) : null,
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

    await logAuditEvent({
      organizationId: session.user.organizationId,
      action: 'CREATE',
      entity: 'Staff',
      entityId: result.staff.id,
      userId: session.user.id,
      after: result.staff,
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
