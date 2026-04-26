const NON_MEANINGFUL_TEXT = new Set(['', 'na', 'n/a', 'none', 'nothing', 'null']);

export function normalizeDisplayText(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (NON_MEANINGFUL_TEXT.has(trimmed.toLowerCase())) {
    return null;
  }

  return trimmed;
}

export function isMeaningfulText(value) {
  return normalizeDisplayText(value) !== null;
}

export function getDisplayText(value, fallback = 'No description provided') {
  const normalized = normalizeDisplayText(value);
  return normalized === null ? fallback : normalized;
}
