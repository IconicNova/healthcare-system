import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { requireOrgRole } from '@/lib/api-safety';
import { SettingsServiceCreateSchema } from '@/lib/validations';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forbiddenResponse = requireOrgRole(session, ['STAFF']);
    if (forbiddenResponse) {
      return forbiddenResponse;
    }

    const services = await prisma.service.findMany({
      where: {
        organizationId: session.user.organizationId,
        status: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        baseRate: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forbiddenResponse = requireOrgRole(session, ['MANAGER']);
    if (forbiddenResponse) {
      return forbiddenResponse;
    }

    const body = await request.json();
    const validationResult = SettingsServiceCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { name, description, duration, baseRate } = validationResult.data;

    const service = await prisma.service.create({
      data: {
        name,
        description: description || null,
        duration: duration || null,
        baseRate,
        organizationId: session.user.organizationId,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
