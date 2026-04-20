/**
 * Visit Status State Machine
 * 
 * Defines all valid visit statuses, their visual configuration,
 * and the allowed transitions between them.
 */

export const VISIT_STATUSES = {
  VACANT: 'VACANT',
  OFFERED: 'OFFERED',
  SCHEDULED: 'SCHEDULED',
  CLOCKED_IN: 'CLOCKED_IN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  APPROVED: 'APPROVED',
  CANCELLED: 'CANCELLED',
  MISSED: 'MISSED',
  NO_SHOW: 'NO_SHOW',
  ON_HOLD: 'ON_HOLD',
  LATE: 'LATE',
};

/**
 * Unified status configuration — single source of truth for colors and labels.
 */
export const STATUS_CONFIG = {
  [VISIT_STATUSES.VACANT]: {
    label: 'Vacant',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    textColor: '#374151',
  },
  [VISIT_STATUSES.OFFERED]: {
    label: 'Offered',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    textColor: '#6D28D9',
  },
  [VISIT_STATUSES.SCHEDULED]: {
    label: 'Scheduled',
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    textColor: '#1D4ED8',
  },
  [VISIT_STATUSES.CLOCKED_IN]: {
    label: 'Clocked In',
    color: '#06B6D4',
    bgColor: '#CFFAFE',
    textColor: '#0E7490',
  },
  [VISIT_STATUSES.IN_PROGRESS]: {
    label: 'In Progress',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    textColor: '#B45309',
  },
  [VISIT_STATUSES.COMPLETED]: {
    label: 'Completed',
    color: '#10B981',
    bgColor: '#D1FAE5',
    textColor: '#047857',
  },
  [VISIT_STATUSES.APPROVED]: {
    label: 'Approved',
    color: '#059669',
    bgColor: '#A7F3D0',
    textColor: '#065F46',
  },
  [VISIT_STATUSES.CANCELLED]: {
    label: 'Cancelled',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    textColor: '#B91C1C',
  },
  [VISIT_STATUSES.MISSED]: {
    label: 'Missed',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    textColor: '#B91C1C',
  },
  [VISIT_STATUSES.NO_SHOW]: {
    label: 'No Show',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    textColor: '#991B1B',
  },
  [VISIT_STATUSES.ON_HOLD]: {
    label: 'On Hold',
    color: '#F97316',
    bgColor: '#FFF7ED',
    textColor: '#C2410C',
  },
  [VISIT_STATUSES.LATE]: {
    label: 'Late',
    color: '#F97316',
    bgColor: '#FFF7ED',
    textColor: '#C2410C',
  },
};

/**
 * Allowed transitions map.
 * Key = current status, Value = array of statuses that can be transitioned to.
 * Terminal statuses (CANCELLED, NO_SHOW, APPROVED) have no further transitions.
 */
/**
 * Single source of truth for valid visit status transitions.
 * Used by: frontend dropdown, scheduling.js, visits/[id]/route.js
 */
export const ALLOWED_TRANSITIONS = {
  [VISIT_STATUSES.VACANT]: [
    VISIT_STATUSES.OFFERED,
    VISIT_STATUSES.SCHEDULED,
    VISIT_STATUSES.CANCELLED,
  ],
  [VISIT_STATUSES.OFFERED]: [
    VISIT_STATUSES.SCHEDULED,
    VISIT_STATUSES.VACANT,
    VISIT_STATUSES.CANCELLED,
  ],
  [VISIT_STATUSES.SCHEDULED]: [
    VISIT_STATUSES.CLOCKED_IN,
    VISIT_STATUSES.IN_PROGRESS,
    VISIT_STATUSES.CANCELLED,
    VISIT_STATUSES.NO_SHOW,
    VISIT_STATUSES.ON_HOLD,
    VISIT_STATUSES.LATE,
    VISIT_STATUSES.VACANT,
    VISIT_STATUSES.OFFERED,
  ],
  [VISIT_STATUSES.CLOCKED_IN]: [
    VISIT_STATUSES.IN_PROGRESS,
    VISIT_STATUSES.COMPLETED,
    VISIT_STATUSES.CANCELLED,
  ],
  [VISIT_STATUSES.IN_PROGRESS]: [
    VISIT_STATUSES.COMPLETED,
    VISIT_STATUSES.ON_HOLD,
    VISIT_STATUSES.CANCELLED,
  ],
  [VISIT_STATUSES.COMPLETED]: [
    VISIT_STATUSES.APPROVED,
  ],
  [VISIT_STATUSES.APPROVED]: [],
  [VISIT_STATUSES.CANCELLED]: [],
  [VISIT_STATUSES.MISSED]: [
    VISIT_STATUSES.SCHEDULED,
  ],
  [VISIT_STATUSES.NO_SHOW]: [
    VISIT_STATUSES.SCHEDULED,
  ],
  [VISIT_STATUSES.ON_HOLD]: [
    VISIT_STATUSES.SCHEDULED,
    VISIT_STATUSES.IN_PROGRESS,
    VISIT_STATUSES.CANCELLED,
  ],
  [VISIT_STATUSES.LATE]: [
    VISIT_STATUSES.IN_PROGRESS,
    VISIT_STATUSES.CLOCKED_IN,
    VISIT_STATUSES.COMPLETED,
    VISIT_STATUSES.CANCELLED,
    VISIT_STATUSES.NO_SHOW,
    VISIT_STATUSES.MISSED,
  ],
};

// Alias for backward-compatibility with scheduling.js imports
export const VALID_VISIT_STATUS_TRANSITIONS = ALLOWED_TRANSITIONS;

/**
 * Returns the list of valid next statuses for a given current status.
 * Always includes the current status itself (for no-change).
 */
export function getValidNextStatuses(currentStatus) {
  const transitions = ALLOWED_TRANSITIONS[currentStatus];
  if (!transitions) {
    return [currentStatus];
  }
  return [currentStatus, ...transitions];
}

/**
 * Checks whether a specific transition is allowed.
 */
export function canTransition(fromStatus, toStatus) {
  if (fromStatus === toStatus) return true;
  const transitions = ALLOWED_TRANSITIONS[fromStatus];
  return transitions ? transitions.includes(toStatus) : false;
}

/**
 * Returns color for a given status.
 */
export function getStatusColor(status) {
  return STATUS_CONFIG[status]?.color || '#6B7280';
}

/**
 * Returns background color for a given status badge.
 */
export function getStatusBgColor(status) {
  return STATUS_CONFIG[status]?.bgColor || '#F3F4F6';
}

/**
 * Returns label for a given status.
 */
export function getStatusLabel(status) {
  return STATUS_CONFIG[status]?.label || status;
}

/**
 * Checks if a status is terminal (no further transitions).
 */
export function isTerminalStatus(status) {
  const transitions = ALLOWED_TRANSITIONS[status];
  return !transitions || transitions.length === 0;
}

/**
 * Groups for TasksView display purposes.
 */
export const PAST_COMPLETED_STATUSES = [
  VISIT_STATUSES.COMPLETED,
  VISIT_STATUSES.APPROVED,
];

export const PAST_INCOMPLETE_STATUSES = [
  VISIT_STATUSES.CANCELLED,
  VISIT_STATUSES.MISSED,
  VISIT_STATUSES.NO_SHOW,
];
