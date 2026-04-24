import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit-log';
import { normalizeCarePlanStatus } from '@/lib/care-plan-status';
import { rateLimit } from '@/lib/rate-limit';

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

    const { id } = params;

    const rateLimitResult = await rateLimit(`care-plans:update:${session.user.id}`, {
      maxRequests: 30,
      windowMs: 60 * 1000,
    });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many care plan changes. Please try again shortly.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) },
        }
      );
    }

    const body = await request.json();

    const carePlan = await prisma.carePlan.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        services: {
          include: { service: true },
        },
      },
    });

    if (!carePlan) {
      return NextResponse.json({ error: 'Care plan not found' }, { status: 404 });
    }

    const { name, description, startDate, endDate, status, clientId, staffId, services } = body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (status !== undefined) updateData.status = normalizeCarePlanStatus(status);
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
      const invalidServices = services.filter(s => !s.serviceId);
      if (invalidServices.length > 0) {
        return NextResponse.json(
          { error: 'All services must have a valid service selected' },
          { status: 400 }
        );
      }

      // Check for duplicates
      const serviceIdSet = new Set(services.map(s => s.serviceId));
      if (serviceIdSet.size !== services.length) {
        return NextResponse.json(
          { error: 'Duplicate services are not allowed in a care plan' },
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
      action: 'UPDATE',
      entity: 'CarePlan',
      entityId: id,
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

    const rateLimitResult = await rateLimit(`care-plans:delete:${session.user.id}`, {
      maxRequests: 20,
      windowMs: 60 * 1000,
    });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many care plan changes. Please try again shortly.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) },
        }
      );
    }

    const revokedCarePlan = await prisma.carePlan.update({
      where: { id },
      data: {
        status: 'REVOKED',
      },
    });

    await logAuditEvent({
      action: 'DELETE',
      entity: 'CarePlan',
      entityId: id,
      userId: session.user.id,
      before: carePlan,
      after: revokedCarePlan,
      changes: { status: { before: carePlan.status, after: 'REVOKED' } },
    });

    return NextResponse.json({ success: true, status: 'REVOKED' });
  } catch (error) {
    console.error('Error deleting care plan:', error);
    return NextResponse.json({ error: 'Failed to delete care plan' }, { status: 500 });
  }
}
