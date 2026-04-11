/**
 * Combines class names
 */
export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Formats currency value
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Formats date
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats time
 */
export function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Formats date and time
 */
export function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Gets initials from first and last name
 */
export function getInitials(firstName, lastName) {
  if (!firstName) return '';
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last;
}

/**
 * Gets status color — unified across all entity types.
 * Each status maps to exactly one color to avoid duplicate-key issues.
 */
export function getStatusColor(status) {
  const statusColors = {
    // Shared / universal
    ACTIVE: 'green',
    INACTIVE: 'gray',
    PENDING: 'yellow',
    ON_HOLD: 'orange',
    DISCHARGED: 'gray',
    // Staff-only
    ON_LEAVE: 'blue',
    TERMINATED: 'red',
    // Visit statuses
    VACANT: 'purple',
    OFFERED: 'indigo',
    SCHEDULED: 'blue',
    IN_PROGRESS: 'cyan',
    CLOCKED_IN: 'cyan',
    COMPLETED: 'green',
    APPROVED: 'green',
    CANCELLED: 'gray',
    NO_SHOW: 'orange',
    MISSED: 'red',
    LATE: 'orange',
    // Form-only
    SUBMITTED: 'blue',
    REJECTED: 'red',
    // Invoice / Billing
    DRAFT: 'gray',
    SENT: 'blue',
    PAID: 'green',
    PARTIALLY_PAID: 'yellow',
    OVERDUE: 'red',
    // Insurance claim
    IN_REVIEW: 'blue',
    DENIED: 'red',
    APPEALED: 'orange',
    VOIDED: 'gray',
  };
  return statusColors[status] || 'gray';
}

/**
 * Calculates age from date of birth
 */
export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Truncates text to specified length
 */
export function truncate(text, length = 50) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Formats phone number
 */
export function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Gets role display name
 */
export function getRoleDisplayName(role) {
  const roleNames = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    SUPERVISOR: 'Supervisor',
    STAFF: 'Staff',
    CLIENT: 'Client',
  };
  return roleNames[role] || role;
}

/**
 * Checks if user has required role or higher.
 * Uses a hierarchical model: SUPER_ADMIN > ADMIN > MANAGER > SUPERVISOR > STAFF > CLIENT.
 * Returns true if the user's role level is >= any of the required roles.
 * Note: SUPER_ADMIN always passes all checks by design (highest privilege).
 */
export function hasRoleAccess(userRole, requiredRoles) {
  if (!userRole) return false;
  const roleHierarchy = {
    SUPER_ADMIN: 6,
    ADMIN: 5,
    MANAGER: 4,
    SUPERVISOR: 3,
    STAFF: 2,
    CLIENT: 1,
  };
  const userLevel = roleHierarchy[userRole] || 0;
  return requiredRoles.some(role => roleHierarchy[role] <= userLevel);
}
