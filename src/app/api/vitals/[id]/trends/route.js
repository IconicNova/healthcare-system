import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch trend data for a specific vital type
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params; // vital sign ID (client ID really, using id for consistency)
    const { searchParams } = new URL(request.url);
    const vitalType = searchParams.get('type'); // temperature, heartRate, etc.
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const days = parseInt(searchParams.get('days') || '30');

    // Verify the client belongs to the user's organization
    const client = await prisma.client.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const where = {
      clientId: id,
      recordedAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    };

    if (startDate) {
      where.recordedAt.gte = new Date(startDate);
    }
    if (endDate) {
      where.recordedAt.lte = new Date(endDate);
    }

    const vitals = await prisma.vitalSign.findMany({
      where,
      orderBy: { recordedAt: 'asc' },
      select: {
        recordedAt: true,
        temperature: true,
        heartRate: true,
        bloodPressureSystolic: true,
        bloodPressureDiastolic: true,
        respiratoryRate: true,
        oxygenSaturation: true,
        painLevel: true,
        weight: true,
        glucose: true,
      },
    });

    // If a specific vital type is requested, filter and format accordingly
    if (vitalType && vitals[0] && vitalType in vitals[0]) {
      const trendData = vitals
        .filter(v => v[vitalType] !== null && v[vitalType] !== undefined)
        .map(v => ({
          date: v.recordedAt,
          value: v[vitalType],
        }));

      return NextResponse.json({
        vitalType,
        data: trendData,
      });
    }

    return NextResponse.json({ vitals });
  } catch (error) {
    console.error('Error fetching vital trends:', error);
    return NextResponse.json({ error: 'Failed to fetch vital trends' }, { status: 500 });
  }
}
