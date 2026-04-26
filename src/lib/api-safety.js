const STAFF_ROLE_TARGETS_BY_ACTOR = {
  SUPER_ADMIN: new Set(['STAFF', 'SUPERVISOR', 'MANAGER']),
  ADMIN: new Set(['STAFF', 'SUPERVISOR', 'MANAGER']),
  MANAGER: new Set(['STAFF', 'SUPERVISOR']),
};

export const ORGANIZATION_MEMBER_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGER',
  'SUPERVISOR',
  'STAFF',
];

export const AVATAR_VALIDATION_ERROR = 'Avatar must be a PNG, JPEG, or WebP data URL under 512 KB';
const MAX_AVATAR_BYTES = 512 * 1024;
const AVATAR_DATA_URL_PATTERN = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

export function requireRole(session, allowedRoles) {
  if (!session?.user?.role || !allowedRoles.includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}

export function requireOrgRole(session, allowedRoles) {
  if (!session?.user?.organizationId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return requireRole(session, allowedRoles);
}

export function canManageStaffRole(actorRole, targetRole) {
  return STAFF_ROLE_TARGETS_BY_ACTOR[actorRole]?.has(targetRole) ?? false;
}

export function parsePaginationParams(
  searchParams,
  { defaultLimit, maxLimit = 100, pageSizeParam = 'limit' }
) {
  const parsedPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const parsedLimit = Number.parseInt(searchParams.get(pageSizeParam) || String(defaultLimit), 10);

  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const safeDefault = Math.min(Math.max(defaultLimit, 1), maxLimit);
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, maxLimit)
      : safeDefault;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function validateAvatarDataUrl(value) {
  if (value === null || value === undefined || value === '') {
    return { ok: true, value: null };
  }

  if (typeof value !== 'string') {
    return { ok: false, error: AVATAR_VALIDATION_ERROR };
  }

  const match = value.match(AVATAR_DATA_URL_PATTERN);
  if (!match) {
    return { ok: false, error: AVATAR_VALIDATION_ERROR };
  }

  const base64Payload = match[2];
  if (Buffer.byteLength(base64Payload, 'base64') > MAX_AVATAR_BYTES) {
    return { ok: false, error: AVATAR_VALIDATION_ERROR };
  }

  return { ok: true, value };
}
