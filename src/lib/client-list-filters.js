export const CLIENT_STATUSES = ['ACTIVE', 'INACTIVE', 'PENDING', 'ON_HOLD', 'DISCHARGED'];

export function buildClientListWhere({ organizationId, search = '', status = '' }) {
  const where = {
    organizationId,
  };

  if (CLIENT_STATUSES.includes(status)) {
    where.status = status;
  } else {
    where.status = { not: 'DISCHARGED' };
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { city: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
}

