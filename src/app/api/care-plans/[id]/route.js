import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { requireOrgRole } from '@/lib/api-safety';
import { CarePlanUpdateSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/audit-log';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const carePlan = await prisma.carePlan.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
          },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
          },
        },
        services: {
          include: {
            service: { select: { id: true, name: true, duration: true, baseRate: true, description: true } },
          },
          orderBy: { order: 'asc' },
        },
        visits: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
          },
          orderBy: { startTime: 'desc' },
          take: 10,
        },
      },
    });

    if (!carePlan) {
      return NextResponse.json({ error: 'Care plan not found' }, { status: 404 });
    }

    return NextResponse.json(carePlan);
  } catch (error) {
    console.error('Error fetching care plan:', error);
    return NextResponse.json({ error: 'Failed to fetch care plan' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forbiddenResponse = requireOrgRole(session, ['MANAGER']);
    if (forbiddenResponse) {
      return forbiddenResponse;
    }

    const { id } = params;
    const body = await request.json();
    const validationResult = CarePlanUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const carePlan = await prisma.carePlan.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!carePlan) {
      return NextResponse.json({ error: 'Care plan not found' }, { status: 404 });
    }

    const { name, description, startDate, endDate, status, clientId, staffId, services } = validationResult.data;

    if (clientId !== undefined) {
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          organizationId: session.user.organizationId,
        },
        select: { id: true },
      });

      if (!client) {
        return NextResponse.json({ error: 'Selected client is invalid for this organization' }, { status: 400 });
      }
    }

    if (staffId !== undefined && staffId !== null) {
      const staff = await prisma.staff.findFirst({
        where: {
          id: staffId,
          organizationId: session.user.organizationId,
        },
        select: { id: true },
      });

      if (!staff) {
        return NextResponse.json({ error: 'Selected staff member is invalid for this organization' }, { status: 400 });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (status !== undefined) updateData.status = status;
    if (clientId !== undefined) updateData.clientId = clientId;
    if (staffId !== undefined) updateData.staffId = staffId || null;

    // Validate dates BEFORE any destructive operations
    const effectiveStartDate = startDate ? new Date(startDate) : carePlan.startDate;
    const effectiveEndDate = endDate !== undefined ? (endDate ? new Date(endDate) : null) : carePlan.endDate;
    if (effectiveEndDate && effectiveEndDate <= effectiveStartDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Validate services before any mutations
    if (services && services.length > 0) {
      const serviceIds = [...new Set(services.map((s) => s.serviceId))];
      const validServices = await prisma.service.findMany({
        where: {
          id: { in: serviceIds },
          organizationId: session.user.organizationId,
        },
        select: { id: true },
      });

      if (validServices.length !== serviceIds.length) {
        return NextResponse.json(
          { error: 'All services must belong to this organization' },
          { status: 400 }
        );
      }
    }

    // All validations passed — perform updates atomically in a transaction
    const updatedCarePlan = await prisma.$transaction(async (tx) => {
      // Update services if provided
      if (services && services.length > 0) {
        await tx.carePlanService.deleteMany({
          where: { carePlanId: id },
        });

        await tx.carePlanService.createMany({
          data: services.map(s => ({
            carePlanId: id,
            serviceId: s.serviceId,
            frequency: s.frequency || 'AS_NEEDED',
            frequencyText: s.frequencyText || null,
            instructions: s.instructions || null,
            order: s.order || 0,
          })),
        });
      }

      // Update and return the care plan with fresh service data
      return tx.carePlan.update({
        where: { id },
        data: updateData,
        include: {
          client: { select: { firstName: true, lastName: true } },
          staff: { select: { firstName: true, lastName: true } },
          services: {
            include: {
              service: { select: { id: true, name: true, duration: true, baseRate: true } },
            },
            orderBy: { order: 'asc' },
          },
        },
      });
    });

    await logAuditEvent({
      organizationId: session.user.organizationId,
      action: 'UPDATE',
      entity: 'CarePlan',
      entityId: updatedCarePlan.id,
      userId: session.user.id,
      before: carePlan,
      after: updatedCarePlan,
    });

    return NextResponse.json(updatedCarePlan);
  } catch (error) {
    console.error('Error updating care plan:', error);
    return NextResponse.json({ error: 'Failed to update care plan' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forbiddenResponse = requireOrgRole(session, ['MANAGER']);
    if (forbiddenResponse) {
      return forbiddenResponse;
    }

    const { id } = params;

    const carePlan = await prisma.carePlan.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
    });

    if (!carePlan) {
      return NextResponse.json({ error: 'Care plan not found' }, { status: 404 });
    }

    await prisma.carePlan.delete({
      where: { id },
    });

    await logAuditEvent({
      organizationId: session.user.organizationId,
      action: 'DELETE',
      entity: 'CarePlan',
      entityId: id,
      userId: session.user.id,
      before: carePlan,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting care plan:', error);
    return NextResponse.json({ error: 'Failed to delete care plan' }, { status: 500 });
  }
}
