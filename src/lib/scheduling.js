const VIEW_SLUGS = ['month', 'week', 'day'];

export const SCHEDULING_STATUS_LABELS = {
  SCHEDULED: 'Scheduled',
  VACANT: 'Vacant',
  OFFERED: 'Offered',
  IN_PROGRESS: 'In Progress',
  CLOCKED_IN: 'Clocked In',
  COMPLETED: 'Completed',
  APPROVED: 'Approved',
  CANCELLED: 'Cancelled',
  ON_HOLD: 'On Hold',
  NO_SHOW: 'No Show',
  MISSED: 'Missed',
  LATE: 'Late',
};

export const STATUS_COLORS = {
  SCHEDULED: '#3B82F6',
  VACANT: '#8B5CF6',
  OFFERED: '#6366F1',
  IN_PROGRESS: '#F59E0B',
  CLOCKED_IN: '#0EA5E9',
  COMPLETED: '#16A34A',
  APPROVED: '#059669',
  CANCELLED: '#9CA3AF',
  ON_HOLD: '#D97706',
  NO_SHOW: '#EF4444',
  MISSED: '#DC2626',
  LATE: '#EA580C',
};

export const ALL_SCHEDULING_STATUSES = Object.keys(SCHEDULING_STATUS_LABELS);
export const CORE_SCHEDULING_STATUSES = [
  'SCHEDULED',
  'VACANT',
  'OFFERED',
  'IN_PROGRESS',
  'CLOCKED_IN',
  'ON_HOLD',
];
export const SECONDARY_SCHEDULING_STATUSES = [
  'COMPLETED',
  'CANCELLED',
  'APPROVED',
  'NO_SHOW',
  'MISSED',
  'LATE',
];

export const CREATE_VISIT_STATUSES = ['SCHEDULED', 'VACANT', 'OFFERED', 'ON_HOLD'];
export const DEFAULT_VISIT_START_TIME = '09:00';
export const DEFAULT_VISIT_END_TIME = '10:00';

// BUG-4 FIX: Single source of truth — import + re-export from visit-status-machine
import { VALID_VISIT_STATUS_TRANSITIONS } from '@/lib/visit-status-machine';
export { VALID_VISIT_STATUS_TRANSITIONS };

export function normalizeSchedulingViewSlug(value) {
  return VIEW_SLUGS.includes(value) ? value : 'month';
}

export function getCalendarViewForSlug(slug) {
  switch (normalizeSchedulingViewSlug(slug)) {
    case 'week':
      return 'timeGridWeek';
    case 'day':
      return 'timeGridDay';
    case 'month':
    default:
      return 'dayGridMonth';
  }
}

export function getSlugForCalendarView(view) {
  switch (view) {
    case 'timeGridWeek':
      return 'week';
    case 'timeGridDay':
      return 'day';
    case 'dayGridMonth':
    default:
      return 'month';
  }
}

export function getAllowedVisitStatuses(currentStatus) {
  const status = currentStatus && SCHEDULING_STATUS_LABELS[currentStatus] ? currentStatus : 'SCHEDULED';
  return [status, ...(VALID_VISIT_STATUS_TRANSITIONS[status] || [])];
}

export function getVisitStatusLabel(status) {
  return SCHEDULING_STATUS_LABELS[status] || status || 'Unknown';
}

export function isSecondarySchedulingStatus(status) {
  return SECONDARY_SCHEDULING_STATUSES.includes(status);
}

export function buildSchedulingStatusPillSections(statusCounts = {}, activeStatus = '') {
  const coreStatuses = CORE_SCHEDULING_STATUSES.map((status) => ({
    status,
    count: statusCounts[status] ?? 0,
    isActive: activeStatus === status,
  }));

  const secondaryStatuses = SECONDARY_SCHEDULING_STATUSES
    .map((status) => ({
      status,
      count: statusCounts[status] ?? 0,
      isActive: activeStatus === status,
    }))
    .filter((item) => item.count > 0);

  const activeSecondaryStatus = isSecondarySchedulingStatus(activeStatus) ? activeStatus : '';

  return {
    coreStatuses,
    secondaryStatuses,
    activeSecondaryStatus,
    hasSecondaryStatuses: secondaryStatuses.length > 0 || Boolean(activeSecondaryStatus),
  };
}

export function parseSchedulingDateParam(value, fallback = new Date()) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const safeFallback = fallback instanceof Date ? fallback : new Date();
  return new Date(
    safeFallback.getFullYear(),
    safeFallback.getMonth(),
    safeFallback.getDate(),
    12,
    0,
    0,
    0
  );
}

export function formatSchedulingDateParam(value) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addDays(date, amount) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount, date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
}

function addMonths(date, amount) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

export function buildSchedulingRange(viewSlug, focusDate) {
  const normalizedView = normalizeSchedulingViewSlug(viewSlug);
  const date = parseSchedulingDateParam(
    focusDate instanceof Date ? formatSchedulingDateParam(focusDate) : focusDate
  );

  if (normalizedView === 'day') {
    return {
      start: startOfDay(date),
      end: endOfDay(date),
    };
  }

  if (normalizedView === 'week') {
    const start = addDays(date, -date.getDay());
    const end = addDays(start, 6);
    return {
      start: startOfDay(start),
      end: endOfDay(end),
    };
  }

  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0, 0);
  const start = addDays(monthStart, -monthStart.getDay());

  return {
    start: startOfDay(start),
    end: endOfDay(addDays(start, 41)),
  };
}

export function buildSchedulingSearchParams({ date, filters = {} }) {
  const params = new URLSearchParams();
  params.set('date', formatSchedulingDateParam(parseSchedulingDateParam(date)));

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }

  return params;
}

export function normalizeVisitPayload(payload = {}) {
  const normalized = { ...payload };

  for (const key of ['staffId', 'serviceId', 'carePlanId', 'branchId', 'title', 'description', 'notes']) {
    if (normalized[key] === '') {
      normalized[key] = null;
    }
  }

  if (normalized.status === 'VACANT') {
    normalized.staffId = null;
  }

  return normalized;
}

export function normalizeVisitFormDate(value, fallback = new Date()) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (value instanceof Date || typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return formatSchedulingDateParam(parsed);
    }
  }

  return formatSchedulingDateParam(parseSchedulingDateParam(fallback));
}

export function buildVisitCreateFormState(initialValues = {}) {
  return {
    clientId: '',
    staffId: '',
    serviceId: '',
    carePlanId: '',
    branchId: '',
    date: normalizeVisitFormDate(initialValues.date),
    startTime: initialValues.startTime || DEFAULT_VISIT_START_TIME,
    endTime: initialValues.endTime || DEFAULT_VISIT_END_TIME,
    status: initialValues.status || 'SCHEDULED',
    notes: initialValues.notes || '',
    recurrence: initialValues.recurrence || { type: 'NONE' },
  };
}

function getEventTimestamp(value) {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

export function hasEventTimingChanged({
  previousStart,
  previousEnd,
  nextStart,
  nextEnd,
  previousAllDay = false,
  nextAllDay = false,
}) {
  return (
    getEventTimestamp(previousStart) !== getEventTimestamp(nextStart) ||
    getEventTimestamp(previousEnd) !== getEventTimestamp(nextEnd) ||
    previousAllDay !== nextAllDay
  );
}

export function validateRecurrence(recurrence) {
  if (!recurrence || recurrence.type === 'NONE') {
    return null;
  }

  switch (recurrence.type) {
    case 'DAILY':
      return recurrence.count >= 2 ? null : 'Daily recurrence requires a number of days';
    case 'WEEKLY':
      return recurrence.weeks >= 2 || recurrence.count >= 2
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
      return recurrence.weeks || recurrence.count;
    default:
      return 1;
  }
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatRecurrenceSummary({ date, recurrence }) {
  if (!recurrence || recurrence.type === 'NONE') {
    return null;
  }

  const start = parseSchedulingDateParam(date);
  const error = validateRecurrence(recurrence);
  if (error) {
    return null;
  }

  let totalVisits = 1;
  let endDate = start;
  let label = 'recurring';

  switch (recurrence.type) {
    case 'DAILY':
      totalVisits = getRecurrenceTotalVisits(recurrence);
      endDate = addDays(start, recurrence.count - 1);
      label = 'daily';
      break;
    case 'WEEKLY':
      totalVisits = getRecurrenceTotalVisits(recurrence);
      endDate = addDays(start, (totalVisits - 1) * 7);
      label = 'weekly';
      break;
    case 'BI_WEEKLY':
      totalVisits = getRecurrenceTotalVisits(recurrence);
      endDate = addDays(start, (recurrence.count - 1) * 14);
      label = 'bi-weekly';
      break;
    case 'MONTHLY':
      totalVisits = getRecurrenceTotalVisits(recurrence);
      endDate = addMonths(start, recurrence.count - 1);
      label = 'monthly';
      break;
    default:
      return null;
  }

  return `Creates ${totalVisits} ${label} visits from ${formatLongDate(start)} to ${formatLongDate(endDate)}`;
}

export function getCarePlanStaffWarning({ carePlan, staffId, staffRecords = [] }) {
  if (!carePlan?.staffId || !staffId || carePlan.staffId === staffId) {
    return null;
  }

  const assignedStaff = carePlan.staff || staffRecords.find((record) => record.id === carePlan.staffId);

  if (!assignedStaff) {
    return 'Selected staff differs from the care plan primary staff.';
  }

  return `Selected staff differs from the care plan primary staff (${assignedStaff.firstName} ${assignedStaff.lastName}).`;
}
