function jsonSafe(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'object') {
    if (typeof value.toJSON === 'function') {
      return jsonSafe(value.toJSON());
    }

    const output = {};
    for (const [key, entry] of Object.entries(value)) {
      output[key] = jsonSafe(entry);
    }
    return output;
  }

  return value;
}

export async function logAudit(db, { session, action, entity, entityId, changes }) {
  if (!db?.auditLog?.create) {
    throw new Error('logAudit requires a db client with auditLog.create');
  }

  return db.auditLog.create({
    data: {
      action,
      entity,
      entityId: entityId ?? null,
      organizationId: session?.user?.organizationId ?? null,
      userId: session?.user?.id ?? null,
      changes: jsonSafe(changes ?? null),
    },
  });
}
