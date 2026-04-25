function addMonthsClamped(date, amount) {
  const next = new Date(date);
  const dayOfMonth = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + amount);
  const lastDayOfTargetMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(dayOfMonth, lastDayOfTargetMonth));
  return next;
}

export function validateRecurrence(recurrence) {
  if (!recurrence || recurrence.type === 'NONE') {
    return null;
  }

  switch (recurrence.type) {
    case 'DAILY':
      return recurrence.count >= 2 ? null : 'Daily recurrence requires a number of days';
    case 'WEEKLY':
      if (recurrence.count !== undefined && recurrence.count !== null) {
        return recurrence.count >= 2 ? null : 'Weekly recurrence requires a number of weeks';
      }

      return recurrence.weeks >= 2
        ? null
        : 'Weekly recurrence requires a number of weeks';
    case 'BI_WEEKLY':
      return recurrence.count >= 2 ? null : 'Bi-weekly recurrence requires a number of cycles';
    case 'MONTHLY':
      return recurrence.count >= 2 ? null : 'Monthly recurrence requires a number of months';
    default:
      return 'Unsupported recurrence type';
  }
}

export function getRecurrenceTotalVisits(recurrence) {
  if (!recurrence || recurrence.type === 'NONE') {
    return 1;
  }

  switch (recurrence.type) {
    case 'DAILY':
    case 'BI_WEEKLY':
    case 'MONTHLY':
      return recurrence.count;
    case 'WEEKLY':
      return recurrence.count || recurrence.weeks || 1;
    default:
      return 1;
  }
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
    let nextStart = new Date(startTime);

    if (recurrence.type === 'MONTHLY') {
      nextStart = addMonthsClamped(startTime, index);
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
