import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const { startDate, endDate, staffId } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const carePlan = await prisma.carePlan.findUnique({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        client: true,
      },
    });

    if (!carePlan) {
      return NextResponse.json({ error: 'Care plan not found' }, { status: 404 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const visits = [];
    let visitId = 1;

    // Generate visits for each service
    for (const planService of carePlan.services) {
      const service = planService.service;
      const frequency = planService.frequency;

      let currentDate = new Date(start);

      while (currentDate <= end) {
        const duration = service.duration || 60;
        const visitStart = new Date(currentDate);
        visitStart.setHours(9, 0, 0, 0); // Default 9 AM
        const visitEnd = new Date(visitStart);
        visitEnd.setMinutes(visitEnd.getMinutes() + duration);

        const visit = await prisma.visit.create({
          data: {
            title: `${service.name} - ${currentDate.toLocaleDateString()}`,
            description: `Scheduled visit from care plan: ${carePlan.name}`,
            startTime: visitStart.toISOString(),
            endTime: visitEnd.toISOString(),
            status: 'SCHEDULED',
            organizationId: carePlan.organizationId,
            branchId: carePlan.branchId,
            carePlanId: carePlan.id,
            serviceId: service.id,
            clientId: carePlan.clientId,
            staffId: staffId || carePlan.staffId || null,
          },
        });

        visits.push(visit);

        // Move to next date based on frequency
        switch (frequency) {
          case 'DAILY':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'WEEKLY':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'BI_WEEKLY':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'MONTHLY':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'AS_NEEDED':
          case 'CUSTOM':
            // For AS_NEEDED and CUSTOM, create one visit per month
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          default:
            currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    return NextResponse.json({
      success: true,
      visitsCreated: visits.length,
      visits,
    });
  } catch (error) {
    console.error('Error generating visits:', error);
    return NextResponse.json({ error: 'Failed to generate visits' }, { status: 500 });
  }
}
