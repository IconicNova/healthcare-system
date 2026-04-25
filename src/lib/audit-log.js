import prisma from '@/lib/prisma';

const SENSITIVE_KEY_PATTERN = /password|passphrase|secret|token|apiKey|apikey|key|ssn|social|cookie|session|authorization|bearer/i;

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
}

export function redactAuditValue(value, seen = new WeakSet()) {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    if (value.startsWith('data:') && value.includes('base64,')) {
      return '[redacted data url]';
    }

    return value.length > 200 ? `${value.slice(0, 197)}...` : value;
  }

  if (typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return '[circular]';
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactAuditValue(item, seen));
  }

  return Object.entries(value).reduce((acc, [key, nestedValue]) => {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      acc[key] = '[redacted]';
      return acc;
    }

    acc[key] = redactAuditValue(nestedValue, seen);
    return acc;
  }, {});
}

export function buildAuditChanges(before, after) {
  if (!isPlainObject(before) || !isPlainObject(after)) {
    return {
      before: redactAuditValue(before),
      after: redactAuditValue(after),
    };
  }

  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changes = {};

  for (const key of keys) {
    const previous = redactAuditValue(before[key]);
    const next = redactAuditValue(after[key]);

    if (JSON.stringify(previous) !== JSON.stringify(next)) {
      changes[key] = { before: previous, after: next };
    }
  }

  return changes;
}

export async function logAuditEvent({
  action,
  entity,
  entityId = null,
  userId,
  before,
  after,
  changes,
}) {
  if (!userId || !action || !entity) {
    return null;
  }

  try {
    const payload = changes ?? buildAuditChanges(before, after);

    return await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        changes: JSON.stringify(payload),
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    return null;
  }
}
