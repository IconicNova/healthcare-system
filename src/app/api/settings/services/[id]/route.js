import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { SettingsServiceUpdateSchema } from '@/lib/validations';

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
    const normalizedBody = {
      name: body.name,
      description: body.description ?? null,
      duration: body.duration === '' || body.duration === null || body.duration === undefined ? null : Number(body.duration),
      baseRate: body.baseRate === '' || body.baseRate === null || body.baseRate === undefined ? undefined : Number(body.baseRate),
      status: body.status,
    };
    const validationResult = SettingsServiceUpdateSchema.safeParse(normalizedBody);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const service = await prisma.service.update({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      data: {
        ...(validationResult.data.name !== undefined && { name: validationResult.data.name }),
        ...(validationResult.data.description !== undefined && { description: validationResult.data.description || null }),
        ...(validationResult.data.duration !== undefined && { duration: validationResult.data.duration }),
        ...(validationResult.data.baseRate !== undefined && { baseRate: validationResult.data.baseRate }),
        ...(validationResult.data.status !== undefined && { status: validationResult.data.status }),
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
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

    // Soft delete by setting status to false
    const service = await prisma.service.update({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      data: {
        status: false,
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
