function isDecimalLike(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof value.toNumber === 'function'
  );
}

export function serializeApiValue(value) {
  if (value === null || value === undefined) return value;
  if (isDecimalLike(value)) return value.toNumber();
  if (Array.isArray(value)) return value.map(serializeApiValue);
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'object') return value;

  const output = {};
  for (const [key, entry] of Object.entries(value)) {
    output[key] = serializeApiValue(entry);
  }
  return output;
}
