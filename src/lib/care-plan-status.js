export const CARE_PLAN_STATUSES = ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'DISCHARGED', 'REVOKED', 'DRAFT'];

const STATUS_META = {
  ACTIVE: { label: 'Active', variant: 'success' },
  ON_HOLD: { label: 'On Hold', variant: 'warning' },
  COMPLETED: { label: 'Completed', variant: 'info' },
  DISCHARGED: { label: 'Discharged', variant: 'default' },
  REVOKED: { label: 'Revoked', variant: 'error' },
  DRAFT: { label: 'Draft', variant: 'default' },
};

export function normalizeCarePlanStatus(status) {
  if (status === true) return 'ACTIVE';
  if (status === false) return 'ON_HOLD';

  if (typeof status !== 'string') {
    return 'ACTIVE';
  }

  const normalized = status.trim().toUpperCase();
  if (normalized === 'ACTIVE' || normalized === 'INACTIVE') {
    return normalized === 'ACTIVE' ? 'ACTIVE' : 'ON_HOLD';
  }

  if (CARE_PLAN_STATUSES.includes(normalized)) {
    return normalized;
  }

  return 'ACTIVE';
}

export function isActiveCarePlanStatus(status) {
  return normalizeCarePlanStatus(status) === 'ACTIVE';
}

export function getCarePlanStatusMeta(status) {
  const normalized = normalizeCarePlanStatus(status);
  return STATUS_META[normalized] ?? STATUS_META.ACTIVE;
}

export function getCarePlanStatusOptions() {
  return CARE_PLAN_STATUSES.map((value) => ({
    value,
    label: STATUS_META[value].label,
  }));
}
