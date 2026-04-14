import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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
    const { id } = await params;
    const body = await request.json();

    // Prevent self-modification of role
    if (id === session.user.id && body.role && body.role !== session.user.role) {
      return NextResponse.json({ error: 'Cannot modify your own role' }, { status: 403 });
    }

    // Prevent non-SUPER_ADMIN from assigning SUPER_ADMIN role
    if (body.role === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only SUPER_ADMIN can assign SUPER_ADMIN role' }, { status: 403 });
    }

    // Validate role is a valid enum value
    const VALID_ROLES = ['STAFF', 'SUPERVISOR', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'];
    if (body.role && !VALID_ROLES.includes(body.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const updateData = {
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role,
      status: body.status !== undefined ? body.status : undefined,
      branchId: body.branchId || null,
    };

    // Hash password if provided
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

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

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
