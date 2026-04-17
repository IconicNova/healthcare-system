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
