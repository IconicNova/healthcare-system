export function getUserStatusFromStaffStatus(status) {
  return status === 'ACTIVE';
}

export function getClientTotalVisits(client) {
  if (typeof client?._count?.visits === 'number') {
    return client._count.visits;
  }

  if (Array.isArray(client?.visits)) {
    return client.visits.length;
  }

  return 0;
}

export function calculateStaffOverviewMetrics(visits = [], now = new Date()) {
  const safeNow = now instanceof Date ? now : new Date(now);
  const thisMonth = new Date(safeNow.getFullYear(), safeNow.getMonth(), 1);
  const completedVisits = visits.filter((visit) => visit.status === 'COMPLETED');
  const visitsThisMonth = visits.filter((visit) => new Date(visit.startTime) >= thisMonth).length;

  const totalDuration = completedVisits.reduce((minutes, visit) => {
    const start = new Date(visit.startTime);
    const end = new Date(visit.endTime);
    return minutes + (end - start) / (1000 * 60);
  }, 0);

  const avgDuration = completedVisits.length > 0
    ? Math.round(totalDuration / completedVisits.length)
    : 0;

  const onTimeVisits = completedVisits.filter((visit) => {
    const scheduled = new Date(visit.startTime);
    const actual = new Date(visit.actualStart || visit.startTime);
    return actual <= scheduled || (actual - scheduled) < 30 * 60 * 1000;
  });

  return {
    totalVisits: completedVisits.length,
    visitsThisMonth,
    avgDuration,
    punctualityRate: completedVisits.length > 0
      ? Math.round((onTimeVisits.length / completedVisits.length) * 100)
      : null,
  };
}

export function getStaffPayRateUnit(payType) {
  if (payType === 'PER_VISIT') {
    return 'visit';
  }

  if (payType === 'SALARY') {
    return 'yr';
  }

  return 'hr';
}
