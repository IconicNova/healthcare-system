import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { buildSettingsConfigPatch, mergeSettingsConfig } from '@/lib/settings-config';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { config: true },
    });

    return NextResponse.json(mergeSettingsConfig(organization?.config));
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
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
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { config: true },
    });
    const currentConfig = mergeSettingsConfig(organization?.config);
    const patchResult = buildSettingsConfigPatch(currentConfig, body);

    if (!patchResult.ok) {
      return NextResponse.json({ error: patchResult.error }, { status: 400 });
    }

    await prisma.organization.update({
      where: { id: session.user.organizationId },
      data: { config: patchResult.value },
    });

    return NextResponse.json(patchResult.value);
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
