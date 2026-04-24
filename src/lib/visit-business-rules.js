import prisma from '@/lib/prisma';
import {
  getCarePlanStaffWarning,
  getRecurrenceTotalVisits,
  validateRecurrence,
} from '@/lib/scheduling';
import { isActiveCarePlanStatus } from '@/lib/care-plan-status';

export async function validateVisitBusinessRules({
  organizationId,
  clientId,
  staffId,
  serviceId,
  carePlanId,
  branchId,
}) {
  const [client, staff, service, branch, carePlan] = await Promise.all([
    prisma.client.findFirst({
      where: { id: clientId, organizationId },
      select: { id: true, branchId: true },
    }),
    staffId
      ? prisma.staff.findFirst({
          where: { id: staffId, organizationId },
          select: { id: true, branchId: true, firstName: true, lastName: true },
        })
      : Promise.resolve(null),
    serviceId
      ? prisma.service.findFirst({
          where: { id: serviceId, organizationId },
          select: { id: true, name: true },
        })
      : Promise.resolve(null),
    branchId
      ? prisma.branch.findFirst({
          where: { id: branchId, organizationId },
          select: { id: true, name: true },
        })
      : Promise.resolve(null),
    carePlanId
      ? prisma.carePlan.findFirst({
          where: { id: carePlanId, organizationId },
          select: {
            id: true,
            name: true,
            status: true,
            clientId: true,
            branchId: true,
            staffId: true,
            serviceId: true,
            staff: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            services: {
              select: { serviceId: true },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  const errors = {};
  const warnings = [];

  if (!client) {
    errors.clientId = ['Selected client is invalid for this organization.'];
  }

  if (staffId && !staff) {
    errors.staffId = ['Selected staff member is invalid for this organization.'];
  }

  if (serviceId && !service) {
    errors.serviceId = ['Selected service is invalid for this organization.'];
  }

  if (branchId && !branch) {
    errors.branchId = ['Selected branch is invalid for this organization.'];
  }

  if (carePlanId && !carePlan) {
    errors.carePlanId = ['Selected care plan is invalid for this organization.'];
  }

  if (carePlan) {
    if (!isActiveCarePlanStatus(carePlan.status)) {
      errors.carePlanId = ['Inactive care plans cannot be used for scheduling.'];
    }

    if (carePlan.clientId !== clientId) {
      errors.carePlanId = ['Selected care plan does not belong to this client.'];
    }

    if (branchId && carePlan.branchId && carePlan.branchId !== branchId) {
      errors.branchId = ['Selected branch must match the care plan branch.'];
    }

    if (serviceId) {
      const allowedServiceIds = carePlan.services.length
        ? carePlan.services.map((carePlanService) => carePlanService.serviceId)
        : carePlan.serviceId
          ? [carePlan.serviceId]
          : [];

      if (allowedServiceIds.length > 0 && !allowedServiceIds.includes(serviceId)) {
        errors.serviceId = ['Selected service is not part of the chosen care plan.'];
      }
    }

    const staffWarning = getCarePlanStaffWarning({
      carePlan,
      staffId,
      staffRecords: staff ? [staff] : [],
    });
    if (staffWarning) {
      warnings.push(staffWarning);
    }
  }

  if (client?.branchId && branchId && client.branchId !== branchId) {
    warnings.push('Selected branch differs from the client home branch.');
  }

  if (staff?.branchId && branchId && staff.branchId !== branchId) {
    warnings.push('Selected branch differs from the caregiver home branch.');
  }

  return {
    errors,
    warnings,
    records: {
      client,
      staff,
      service,
      branch,
      carePlan,
    },
  };
}

export async function collectVisitConflicts({
  organizationId,
  visitId,
  clientId,
  staffId,
  startTime,
  endTime,
}) {
  const baseTimeWindow = {
    startTime: { lt: endTime },
    endTime: { gt: startTime },
  };

  let conflicts = [];

  if (staffId) {
    const staffConflicts = await prisma.visit.findMany({
      where: {
        organizationId,
        staffId,
        status: { not: 'CANCELLED' },
        ...(visitId ? { id: { not: visitId } } : {}),
        OR: [baseTimeWindow],
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    });

    conflicts = conflicts.concat(
      staffConflicts.map((visit) => ({
        type: 'STAFF',
        visitId: visit.id,
        startTime: visit.startTime,
        endTime: visit.endTime,
      }))
    );
  }

  const clientConflicts = await prisma.visit.findMany({
    where: {
      organizationId,
      clientId,
      status: { not: 'CANCELLED' },
      ...(visitId ? { id: { not: visitId } } : {}),
      OR: [baseTimeWindow],
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
    },
  });

  conflicts = conflicts.concat(
    clientConflicts.map((visit) => ({
      type: 'CLIENT',
      visitId: visit.id,
      startTime: visit.startTime,
      endTime: visit.endTime,
    }))
  );

  return conflicts;
}

export function buildRecurringVisitPayloads({
  recurrence,
  baseData,
  startTime,
  endTime,
}) {
  if (!recurrence || recurrence.type === 'NONE') {
    return {
      error: null,
      proposedVisits: [],
    };
  }

  const recurrenceError = validateRecurrence(recurrence);
  if (recurrenceError) {
    return {
      error: recurrenceError,
      proposedVisits: [],
    };
  }

  const totalVisits = getRecurrenceTotalVisits(recurrence);
  const duration = endTime.getTime() - startTime.getTime();
  const proposedVisits = [];

  for (let index = 1; index < totalVisits; index += 1) {
    const nextStart = new Date(startTime);

    if (recurrence.type === 'MONTHLY') {
      nextStart.setMonth(nextStart.getMonth() + index);
    } else if (recurrence.type === 'BI_WEEKLY') {
      nextStart.setDate(nextStart.getDate() + index * 14);
    } else if (recurrence.type === 'WEEKLY') {
      nextStart.setDate(nextStart.getDate() + index * 7);
    } else {
      nextStart.setDate(nextStart.getDate() + index);
    }

    proposedVisits.push({
      startTime: nextStart,
      endTime: new Date(nextStart.getTime() + duration),
      data: {
        ...baseData,
        startTime: nextStart,
        endTime: new Date(nextStart.getTime() + duration),
      },
    });
  }

  return {
    error: null,
    proposedVisits,
  };
}
