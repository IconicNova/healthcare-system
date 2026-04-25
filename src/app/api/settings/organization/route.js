import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { SettingsOrganizationPatchSchema } from '@/lib/validations';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error fetching organization settings:', error);
    return NextResponse.json({ error: 'Failed to fetch organization settings' }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is ADMIN
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validationResult = SettingsOrganizationPatchSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: {
        ...(validationResult.data.name !== undefined && { name: validationResult.data.name }),
        ...(validationResult.data.email !== undefined && { email: validationResult.data.email }),
        ...(validationResult.data.phone !== undefined && { phone: validationResult.data.phone || null }),
        ...(validationResult.data.address !== undefined && { address: validationResult.data.address || null }),
        ...(validationResult.data.city !== undefined && { city: validationResult.data.city || null }),
        ...(validationResult.data.state !== undefined && { state: validationResult.data.state || null }),
        ...(validationResult.data.zipCode !== undefined && { zipCode: validationResult.data.zipCode || null }),
      },
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error('Error updating organization settings:', error);
    return NextResponse.json({ error: 'Failed to update organization settings' }, { status: 500 });
  }
}
