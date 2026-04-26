const DEFAULT_THRESHOLD_MINUTES = 30;
const MINUTE_MS = 60 * 1000;

function toDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDuration(minutes) {
  const totalMinutes = Math.max(0, Math.round(minutes));
  const hours = Math.floor(totalMinutes / 60);
  const remainder = totalMinutes % 60;

  if (hours > 0 && remainder > 0) {
    return `${hours}h ${remainder}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${remainder}m`;
}

function formatDelta(minutes, { noun, direction }) {
  const absMinutes = Math.abs(minutes);
  const suffix = minutes >= 0 ? 'later' : 'earlier';
  return `${noun} is ${formatDuration(absMinutes)} ${suffix} than ${direction}`;
}

export function getVisitTimeDeviationWarning(visit, { thresholdMinutes = DEFAULT_THRESHOLD_MINUTES } = {}) {
  const scheduledStart = toDate(visit?.startTime);
  const scheduledEnd = toDate(visit?.endTime);
  const actualStart = toDate(visit?.actualStart);
  const actualEnd = toDate(visit?.actualEnd);

  if (!actualStart && !actualEnd) {
    return null;
  }

  const findings = [];

  if (scheduledStart && actualStart) {
    const deltaMinutes = (actualStart.getTime() - scheduledStart.getTime()) / MINUTE_MS;
    if (Math.abs(deltaMinutes) > thresholdMinutes) {
      findings.push(formatDelta(deltaMinutes, { noun: 'Actual start', direction: 'scheduled start' }));
    }
  }

  if (scheduledEnd && actualEnd) {
    const deltaMinutes = (actualEnd.getTime() - scheduledEnd.getTime()) / MINUTE_MS;
    if (Math.abs(deltaMinutes) > thresholdMinutes) {
      findings.push(formatDelta(deltaMinutes, { noun: 'Actual end', direction: 'scheduled end' }));
    }
  }

  if (scheduledStart && scheduledEnd && actualStart && actualEnd) {
    const scheduledDuration = (scheduledEnd.getTime() - scheduledStart.getTime()) / MINUTE_MS;
    const actualDuration = (actualEnd.getTime() - actualStart.getTime()) / MINUTE_MS;
    const durationDelta = actualDuration - scheduledDuration;

    if (Math.abs(durationDelta) > thresholdMinutes) {
      const direction = durationDelta >= 0 ? 'longer than scheduled duration' : 'shorter than scheduled duration';
      findings.push(`Actual duration is ${formatDuration(durationDelta)} ${direction}`);
    }
  }

  if (findings.length === 0) {
    return null;
  }

  return {
    type: 'time-deviation',
    severity: 'warning',
    title: 'Visit time mismatch',
    message: findings.join('; '),
    findings,
  };
}
