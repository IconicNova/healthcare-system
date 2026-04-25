export function buildWeeklyVisitChartData(weeklyVisits, startOfWeek) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    const dayVisits = weeklyVisits.filter((visit) => visit.startTime >= date && visit.startTime < nextDay);

    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      scheduled: dayVisits.filter((visit) => ['SCHEDULED', 'OFFERED', 'IN_PROGRESS', 'CLOCKED_IN'].includes(visit.status)).length,
      completed: dayVisits.filter((visit) => ['COMPLETED', 'APPROVED'].includes(visit.status)).length,
    };
  });
}

export function buildEvvSummary(evvVisits) {
  const verifiedVisits = evvVisits.filter((visit) => visit.actualStart && visit.actualEnd).length;
  const evvTotal = evvVisits.length;

  return {
    verified: verifiedVisits,
    unverified: evvTotal - verifiedVisits,
    rate: evvTotal > 0 ? Math.round((verifiedVisits / evvTotal) * 100) : 0,
  };
}
