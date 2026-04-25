function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function isDecimalLike(value) {
  return Boolean(value)
    && typeof value === 'object'
    && typeof value.toNumber === 'function'
    && typeof value.toString === 'function'
    && !Array.isArray(value);
}

export function serializePrismaValue(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (isDecimalLike(value)) {
    return value.toNumber();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializePrismaValue(item));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, serializePrismaValue(nestedValue)])
    );
  }

  return value;
}

export function serializePrismaResult(value) {
  return serializePrismaValue(value);
}
