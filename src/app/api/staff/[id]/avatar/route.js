import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// PUT /api/staff/[id]/avatar - Update staff avatar
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { avatarUrl } = body;

    // Check if staff exists
    const existing = await prisma.staff.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Update avatar in User table (staff avatars are stored in the linked User record)
    let result;
    if (existing.userId) {
      result = await prisma.user.update({
        where: { id: existing.userId },
        data: { avatar: avatarUrl || null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      });
    } else {
      // If no user exists, create one to store the avatar
      const hashedPassword = await bcrypt.hash(Math.random().toString(36).slice(-10), 10);
      result = await prisma.user.create({
        data: {
          email: existing.email,
          firstName: existing.firstName,
          lastName: existing.lastName,
          role: 'STAFF',
          avatar: avatarUrl || null,
          password: hashedPassword,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      });

      // Link user to staff
      await prisma.staff.update({
        where: { id },
        data: { userId: result.id },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating staff avatar:', error);
    return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 });
  }
}

// DELETE /api/staff/[id]/avatar - Remove staff avatar
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if staff exists
    const existing = await prisma.staff.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Remove avatar from User table
    let result;
    if (existing.userId) {
      result = await prisma.user.update({
        where: { id: existing.userId },
        data: { avatar: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      });
    } else {
      // No user exists, return empty result
      result = {
        firstName: existing.firstName,
        lastName: existing.lastName,
        avatar: null,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error removing staff avatar:', error);
    return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 });
  }
}
