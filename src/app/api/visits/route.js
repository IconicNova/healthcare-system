import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { VisitSchema } from '@/lib/validations';
import { ApiResponse } from '@/lib/api-response';
import { parsePaginationParams, requireOrgRole } from '@/lib/api-safety';
import { normalizeVisitPayload } from '@/lib/scheduling';
import { VISIT_MANAGEMENT_ROLES } from '@/lib/visit-access';
import {
  buildRecurringVisitPayloads,
  collectVisitConflicts,
  validateVisitBusinessRules,
} from '@/lib/visit-business-rules';
import { logAuditEvent } from '@/lib/audit-log';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start') || searchParams.get('startDate');
    const endDate = searchParams.get('end') || searchParams.get('endDate');
    const staffId = searchParams.get('staffId');
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');
    const { page, limit, skip } = parsePaginationParams(searchParams, { defaultLimit: 100, maxLimit: 500 });

    const where = {
      organizationId: session.user.organizationId,
    };

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (staffId) {
      where.staffId = staffId;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          carePlan: {
            select: {
              id: true,
              name: true,
              staffId: true,
              staff: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
              baseRate: true,
            },
          },
        },
        orderBy: { startTime: 'asc' },
      }),
      prisma.visit.count({ where }),
    ]);

    return NextResponse.json({
      visits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching visits:', error);
    return NextResponse.json({ error: 'Failed to fetch visits' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const forbiddenResponse = requireOrgRole(session, VISIT_MANAGEMENT_ROLES);
    if (forbiddenResponse) {
      return forbiddenResponse;
    }

    const rawBody = await request.json();
    if (rawBody.status === 'VACANT' && rawBody.staffId) {
      return ApiResponse.error('Vacant visits cannot have assigned staff', 400, {
        staffId: ['Vacant visits cannot have assigned staff.'],
      });
    }

    const body = normalizeVisitPayload(rawBody);

    const validationResult = VisitSchema.safeParse(body);
    if (!validationResult.success) {
      return ApiResponse.error('Validation failed', 400, validationResult.error.format());
    }

    const {
      clientId,
      staffId,
      serviceId,
      carePlanId,
      branchId,
      startTime,
      endTime,
      status,
      title,
      description,
      notes,
      recurrence,
    } = body;

    if (!serviceId || !branchId) {
      return ApiResponse.error('Service and Branch are required', 400);
    }

    if (new Date(endTime) <= new Date(startTime)) {
      return ApiResponse.error('End time must be after start time', 400);
    }

    const businessValidation = await validateVisitBusinessRules({
      organizationId: session.user.organizationId,
      clientId,
      staffId,
      serviceId,
      carePlanId,
      branchId,
    });
    if (Object.keys(businessValidation.errors).length > 0) {
      return ApiResponse.error('Validation failed', 400, businessValidation.errors);
    }

    const normalizedStartTime = new Date(startTime);
    const normalizedEndTime = new Date(endTime);
    const recurrencePlan = buildRecurringVisitPayloads({
      recurrence,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      baseData: {
        clientId,
        staffId: staffId || null,
        serviceId: serviceId || null,
        carePlanId: carePlanId || null,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime,
        status: status || 'SCHEDULED',
        title: title || null,
        description: description || null,
        notes: notes || null,
        organizationId: session.user.organizationId,
        branchId: branchId || null,
        userId: session.user.id,
      },
    });
    if (recurrencePlan.error) {
      return ApiResponse.error(recurrencePlan.error, 400, {
        recurrence: [recurrencePlan.error],
      });
    }

    const conflicts = await collectVisitConflicts({
      organizationId: session.user.organizationId,
      clientId,
      staffId,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Time slot conflict detected', conflicts },
        { status: 409 }
      );
    }

    // Create visit
    const visit = await prisma.visit.create({
      data: {
        clientId,
        staffId: staffId || null,
        serviceId: serviceId || null,
        carePlanId: carePlanId || null,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime,
        status: status || 'SCHEDULED',
        title: title || null,
        description: description || null,
        notes: notes || null,
        organizationId: session.user.organizationId,
        branchId: branchId || null,
        userId: session.user.id,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        carePlan: {
          select: {
            id: true,
            name: true,
            staffId: true,
            staff: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            baseRate: true,
          },
        },
      },
    });

    await logAuditEvent({
      organizationId: session.user.organizationId,
      action: 'CREATE',
      entity: 'Visit',
      entityId: visit.id,
      userId: session.user.id,
      after: visit,
    });

    const occurrences = [];
    const skippedDates = [];
    if (recurrencePlan.proposedVisits.length > 0) {
      const timeConditions = recurrencePlan.proposedVisits.map((proposedVisit) => ({
        startTime: { lt: proposedVisit.endTime },
        endTime: { gt: proposedVisit.startTime },
      }));

      const [batchedStaffConflicts, batchedClientConflicts] = await Promise.all([
        staffId
          ? prisma.visit.findMany({
              where: {
                staffId,
                organizationId: session.user.organizationId,
                status: { not: 'CANCELLED' },
                OR: timeConditions,
              },
              select: { startTime: true, endTime: true },
            })
          : Promise.resolve([]),
        prisma.visit.findMany({
          where: {
            clientId,
            organizationId: session.user.organizationId,
            status: { not: 'CANCELLED' },
            OR: timeConditions,
          },
          select: { startTime: true, endTime: true },
        }),
      ]);

      const validVisits = [];
      for (const proposedVisit of recurrencePlan.proposedVisits) {
        const hasStaffConflict =
          staffId &&
          batchedStaffConflicts.some(
            (conflict) => conflict.startTime < proposedVisit.endTime && conflict.endTime > proposedVisit.startTime
          );
        const hasClientConflict = batchedClientConflicts.some(
          (conflict) => conflict.startTime < proposedVisit.endTime && conflict.endTime > proposedVisit.startTime
        );

        if (hasStaffConflict || hasClientConflict) {
          skippedDates.push(proposedVisit.startTime.toISOString());
        } else {
          validVisits.push(proposedVisit.data);
        }
      }

      if (validVisits.length > 0) {
        const createdVisits = await prisma.$transaction(
          validVisits.map((data) => prisma.visit.create({ data }))
        );
        occurrences.push(...createdVisits.map((createdVisit) => createdVisit.id));
      }
    }

    return NextResponse.json({
      ...visit,
      conflicts,
      recurringOccurrences: occurrences,
      skippedDates,
      warnings: businessValidation.warnings,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating visit:', error);
    return NextResponse.json({ error: 'Failed to create visit' }, { status: 500 });
  }
}
