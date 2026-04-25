import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SettingsUserUpdateSchema } from '@/lib/validations';
import { enforceRouteRateLimit } from '@/lib/route-rate-limit';
import { logAuditEvent } from '@/lib/audit-log';

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is ADMIN
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const rateLimitResponse = await enforceRouteRateLimit(session, 'settings-users-update', {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000,
      message: 'Too many password or profile changes. Please try again later.',
    });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { id } = await params;
    const body = await request.json();
    const normalizedBody = {
      ...body,
      branchId: body.branchId || null,
    };
    const validationResult = SettingsUserUpdateSchema.safeParse(normalizedBody);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Prevent self-modification of role
    if (id === session.user.id && validationResult.data.role && validationResult.data.role !== session.user.role) {
      return NextResponse.json({ error: 'Cannot modify your own role' }, { status: 403 });
    }

    // Prevent non-SUPER_ADMIN from assigning SUPER_ADMIN role
    if (validationResult.data.role === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only SUPER_ADMIN can assign SUPER_ADMIN role' }, { status: 403 });
    }

    const updateData = {
      ...(validationResult.data.email !== undefined && { email: validationResult.data.email }),
      ...(validationResult.data.firstName !== undefined && { firstName: validationResult.data.firstName }),
      ...(validationResult.data.lastName !== undefined && { lastName: validationResult.data.lastName }),
      ...(validationResult.data.role !== undefined && { role: validationResult.data.role }),
      ...(validationResult.data.status !== undefined && { status: validationResult.data.status }),
      ...(validationResult.data.branchId !== undefined && { branchId: validationResult.data.branchId || null }),
    };

    // Hash password if provided
    if (validationResult.data.password) {
      updateData.password = await bcrypt.hash(validationResult.data.password, 10);
    }

    const beforeUser = await prisma.user.findFirst({
      where: {
        id,
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
        branchId: true,
      },
    });

    const user = await prisma.user.update({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      data: updateData,
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
      },
    });

    await logAuditEvent({
      action: 'UPDATE',
      entity: 'User',
      entityId: user.id,
      userId: session.user.id,
      before: beforeUser,
      after: user,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
