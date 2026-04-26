const ROUTE_LABELS = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clients',
  '/staff': 'Staff',
  '/scheduling': 'Scheduling',
  '/care-delivery': 'Care Delivery',
  '/care-plans': 'Care Plans',
  '/billing': 'Billing',
  '/payroll': 'Payroll',
  '/reports': 'Reports',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function humanizeSegment(segment) {
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
}

export function buildBreadcrumbItems(pathname, labels = {}) {
  const segments = pathname.split('/').filter(Boolean);

  return segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join('/')}`;
    const label =
      labels[path] ||
      ROUTE_LABELS[path] ||
      (UUID_REGEX.test(segment) ? 'Details' : humanizeSegment(segment));

    return {
      path,
      label,
      isLast: index === segments.length - 1,
    };
  });
}

export function isUuidSegment(value) {
  return UUID_REGEX.test(value);
}

export { ROUTE_LABELS, UUID_REGEX };
