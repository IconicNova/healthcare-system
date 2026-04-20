export const CARE_DELIVERY_TABS = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'forms-review', label: 'Forms Review' },
  { id: 'progress', label: 'Progress Notes' },
  { id: 'reports', label: 'Visit Reports' },
  { id: 'vitals', label: 'Vitals' },
];

const DEFAULT_CARE_DELIVERY_PATH = '/care-delivery';
const VALID_TAB_IDS = new Set(CARE_DELIVERY_TABS.map((tab) => tab.id));
const VALID_VISIT_MODAL_TABS = new Set([
  'info',
  'tasks',
  'forms',
  'notes',
  'goals',
  'activities',
  'attachments',
]);

export function resolveCareDeliveryTab(tab) {
  return VALID_TAB_IDS.has(tab) ? tab : 'tasks';
}

export function buildCareDeliveryClientPath(clientId, tab = 'tasks') {
  if (!clientId) {
    return DEFAULT_CARE_DELIVERY_PATH;
  }

  const basePath = `${DEFAULT_CARE_DELIVERY_PATH}/${clientId}`;
  const resolvedTab = resolveCareDeliveryTab(tab);

  if (resolvedTab === 'tasks') {
    return basePath;
  }

  return `${basePath}?tab=${encodeURIComponent(resolvedTab)}`;
}

export function buildCareDeliveryFormPath(formId, returnTo = '') {
  const basePath = `${DEFAULT_CARE_DELIVERY_PATH}/forms/${formId}`;
  const safeReturnTo = resolveCareDeliveryReturnTo(returnTo, '');

  if (!safeReturnTo) {
    return basePath;
  }

  return `${basePath}?returnTo=${encodeURIComponent(safeReturnTo)}`;
}

export function resolveCareDeliveryReturnTo(returnTo, fallback = DEFAULT_CARE_DELIVERY_PATH) {
  if (typeof returnTo !== 'string') {
    return fallback;
  }

  const trimmedValue = returnTo.trim();
  if (!trimmedValue.startsWith('/')) {
    return fallback;
  }

  if (trimmedValue.startsWith('//')) {
    return fallback;
  }

  return trimmedValue;
}

export function resolveCareDeliveryVisitTab(tab) {
  if (typeof tab !== 'string') {
    return 'info';
  }

  const trimmedValue = tab.trim();
  return VALID_VISIT_MODAL_TABS.has(trimmedValue) ? trimmedValue : 'info';
}

export function buildCareDeliveryVisitPath(clientId, visitId, tab = 'info') {
  if (!clientId || !visitId) {
    return DEFAULT_CARE_DELIVERY_PATH;
  }

  const basePath = buildCareDeliveryClientPath(clientId);

  const searchParams = new URLSearchParams();
  searchParams.set('visitId', visitId);
  searchParams.set('visitTab', resolveCareDeliveryVisitTab(tab));

  return `${basePath}?${searchParams.toString()}`;
}

export function resolveCareDeliveryVisitContext(searchParams) {
  if (!searchParams || typeof searchParams.get !== 'function') {
    return { visitId: '', visitTab: 'info' };
  }

  const visitId = searchParams.get('visitId')?.trim() || '';
  if (!visitId) {
    return { visitId: '', visitTab: 'info' };
  }

  return {
    visitId,
    visitTab: resolveCareDeliveryVisitTab(searchParams.get('visitTab')),
  };
}

/**
 * Shared helper to generate initials from a client or record with firstName/lastName.
 * Replaces duplicated formatInitials functions across CareDeliveryList and CareDeliveryWorkspace.
 */
export function formatInitials(record) {
  if (!record) return '??';
  const first = record.firstName?.charAt(0) || '';
  const last = record.lastName?.charAt(0) || '';
  return `${first}${last}`.toUpperCase() || '??';
}

/**
 * Formats a date to a human-readable time string.
 */
export function formatVisitTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formats a date for display (short format).
 */
export function formatVisitDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a Date or ISO string for an <input type="datetime-local" /> field.
 */
export function formatDatetimeLocalInputValue(value) {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Converts a local datetime input value back to an ISO string for persistence.
 */
export function toIsoFromDatetimeLocalInputValue(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}
