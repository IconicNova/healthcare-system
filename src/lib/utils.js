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
 * Gets status color
 */
export function getStatusColor(status) {
  const statusColors = {
    // Client status
    ACTIVE: 'green',
    INACTIVE: 'gray',
    PENDING: 'yellow',
    ON_HOLD: 'orange',
    // Staff status
    ACTIVE: 'green',
    INACTIVE: 'gray',
    ON_LEAVE: 'blue',
    TERMINATED: 'red',
    // Visit status
    SCHEDULED: 'blue',
    IN_PROGRESS: 'cyan',
    COMPLETED: 'green',
    CANCELLED: 'red',
    NO_SHOW: 'orange',
    MISSED: 'red',
    // Form status
    PENDING: 'yellow',
    COMPLETED: 'gray',
    SUBMITTED: 'blue',
    APPROVED: 'green',
    REJECTED: 'red',
    // Invoice status
    DRAFT: 'gray',
    SENT: 'blue',
    PAID: 'green',
    OVERDUE: 'red',
    CANCELLED: 'gray',
    // Timesheet status
    DRAFT: 'gray',
    SUBMITTED: 'yellow',
    APPROVED: 'green',
    REJECTED: 'red',
    PAID: 'green',
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
 * Checks if user has required role or higher
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
