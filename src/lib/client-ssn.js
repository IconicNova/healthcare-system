const MASKED_SSN_PATTERN = /^\*{3}-\*{2}-\d{4}$/;

export function isMaskedSsn(value) {
  return MASKED_SSN_PATTERN.test((value ?? '').trim());
}

export function shouldValidateSsn(value) {
  const normalizedValue = (value ?? '').trim();
  return normalizedValue.length > 0 && !isMaskedSsn(normalizedValue);
}

export function normalizeSsnForSubmission(value) {
  const normalizedValue = (value ?? '').trim();

  if (isMaskedSsn(normalizedValue)) {
    return undefined;
  }

  return normalizedValue;
}
