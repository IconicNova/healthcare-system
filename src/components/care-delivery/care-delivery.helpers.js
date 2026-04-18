export const CARE_DELIVERY_TABS = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'forms-review', label: 'Forms Review' },
  { id: 'progress', label: 'Progress Notes' },
  { id: 'reports', label: 'Visit Reports' },
  { id: 'vitals', label: 'Vitals' },
];

const DEFAULT_CARE_DELIVERY_PATH = '/care-delivery';
const VALID_TAB_IDS = new Set(CARE_DELIVERY_TABS.map((tab) => tab.id));

export function resolveCareDeliveryTab(tab) {
  return VALID_TAB_IDS.has(tab) ? tab : 'tasks';
}

export function buildCareDeliveryClientPath(clientId, tab = 'tasks') {
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
