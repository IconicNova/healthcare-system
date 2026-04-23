const STAFF_ROLE_TARGETS_BY_ACTOR = {
  SUPER_ADMIN: new Set(['STAFF', 'SUPERVISOR', 'MANAGER']),
  ADMIN: new Set(['STAFF', 'SUPERVISOR', 'MANAGER']),
  MANAGER: new Set(['STAFF', 'SUPERVISOR']),
};

export const CLINICAL_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF'];
export const CLIENT_MUTATION_ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];

export const AVATAR_VALIDATION_ERROR = 'Avatar must be a PNG, JPEG, or WebP data URL under 512 KB';
export const ATTACHMENT_VALIDATION_ERROR =
  'Attachments must be PDF, JPEG, PNG, or WebP files with a valid signature';
const MAX_AVATAR_BYTES = 512 * 1024;
const AVATAR_DATA_URL_PATTERN = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export function requireClinicalRole(session) {
  if (!session?.user?.role || !CLINICAL_ROLES.includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}

export function requireRole(session, allowedRoles) {
  if (!session?.user?.role || !allowedRoles.includes(session.user.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
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

export function pickAllowedFields(body, allowedFields) {
  const picked = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      picked[field] = body[field];
    }
  }

  return picked;
}

function matchesPdfSignature(buffer) {
  return buffer.length >= 5 && buffer.subarray(0, 5).toString('latin1') === '%PDF-';
}

function matchesJpegSignature(buffer) {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function matchesPngSignature(buffer) {
  const signature = Buffer.from('89504e470d0a1a0a', 'hex');
  return buffer.length >= signature.length && buffer.subarray(0, signature.length).equals(signature);
}

function matchesWebpSignature(buffer) {
  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buffer.subarray(8, 12).toString('latin1') === 'WEBP'
  );
}

export function validateAttachmentFile(file, buffer) {
  if (!file || typeof file !== 'object') {
    return { ok: false, error: ATTACHMENT_VALIDATION_ERROR };
  }

  if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(file.type)) {
    return { ok: false, error: ATTACHMENT_VALIDATION_ERROR };
  }

  if (!Buffer.isBuffer(buffer)) {
    return { ok: false, error: ATTACHMENT_VALIDATION_ERROR };
  }

  if (file.type === 'application/pdf' && !matchesPdfSignature(buffer)) {
    return { ok: false, error: ATTACHMENT_VALIDATION_ERROR };
  }

  if (file.type === 'image/jpeg' && !matchesJpegSignature(buffer)) {
    return { ok: false, error: ATTACHMENT_VALIDATION_ERROR };
  }

  if (file.type === 'image/png' && !matchesPngSignature(buffer)) {
    return { ok: false, error: ATTACHMENT_VALIDATION_ERROR };
  }

  if (file.type === 'image/webp' && !matchesWebpSignature(buffer)) {
    return { ok: false, error: ATTACHMENT_VALIDATION_ERROR };
  }

  return { ok: true, value: file };
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
