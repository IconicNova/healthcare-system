import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PUT /api/clients/[id]/avatar - Update client avatar
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { avatarUrl } = body;

    // Check if client exists
    const existing = await prisma.client.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Update client avatar
    const client = await prisma.client.update({
      where: { id },
      data: { avatar: avatarUrl || null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error updating client avatar:', error);
    return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 });
  }
}

// DELETE /api/clients/[id]/avatar - Remove client avatar
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if client exists
    const existing = await prisma.client.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Remove client avatar
    const client = await prisma.client.update({
      where: { id },
      data: { avatar: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error removing client avatar:', error);
    return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 });
  }
}
