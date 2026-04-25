import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SettingsUserCreateSchema } from '@/lib/validations';
import { enforceRouteRateLimit } from '@/lib/route-rate-limit';
import { logAuditEvent } from '@/lib/audit-log';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is ADMIN
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        staff: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is ADMIN
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const rateLimitResponse = await enforceRouteRateLimit(session, 'settings-users-create', {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000,
      message: 'Too many user creation attempts. Please try again later.',
    });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const normalizedBody = {
      ...body,
      branchId: body.branchId || null,
      };
      const validationResult = SettingsUserCreateSchema.safeParse(normalizedBody);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid data', details: validationResult.error.format() },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validationResult.data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: validationResult.data.email,
        password: hashedPassword,
          firstName: validationResult.data.firstName,
          lastName: validationResult.data.lastName,
          role: validationResult.data.role || 'STAFF',
          organizationId: session.user.organizationId,
          branchId: validationResult.data.branchId || null,
        },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        branchId: true,
      },
    });

    await logAuditEvent({
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      userId: session.user.id,
      after: user,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
