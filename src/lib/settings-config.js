export const DEFAULT_SETTINGS_CONFIG = Object.freeze({
  scheduling: Object.freeze({
    defaultShiftLength: 8,
    maxOvertimeHours: 10,
    clockInWindow: 15,
    lateThreshold: 6,
    requireGPS: true,
    autoCancelHours: 24,
  }),
  billing: Object.freeze({
    taxRate: 0,
    paymentTerms: 30,
    invoicePrefix: 'INV',
    paymentMethods: Object.freeze(['cash', 'check', 'card', 'transfer']),
  }),
  payroll: Object.freeze({
    overtimeThreshold: 40,
    overtimeMultiplier: 1.5,
    mileageRate: 0.67,
    payPeriod: 'biweekly',
  }),
  notifications: Object.freeze({
    lateClockInAlert: true,
    lateClockInThreshold: 15,
    missedVisitAlert: true,
    expiringCertWarning: true,
    expiringCertDays: 30,
    formDueReminder: true,
    formDueHours: 24,
    invoiceOverdueAlert: true,
    invoiceOverdueDays: 7,
  }),
});

function cloneConfig(config) {
  return JSON.parse(JSON.stringify(config));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateValue(section, key, value) {
  const defaultValue = DEFAULT_SETTINGS_CONFIG[section][key];

  if (Array.isArray(defaultValue)) {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
  }

  return typeof value === typeof defaultValue;
}

export function mergeSettingsConfig(storedConfig) {
  const merged = cloneConfig(DEFAULT_SETTINGS_CONFIG);
  if (!isPlainObject(storedConfig)) {
    return merged;
  }

  for (const section of Object.keys(DEFAULT_SETTINGS_CONFIG)) {
    if (isPlainObject(storedConfig[section])) {
      for (const key of Object.keys(DEFAULT_SETTINGS_CONFIG[section])) {
        if (Object.prototype.hasOwnProperty.call(storedConfig[section], key)) {
          const value = storedConfig[section][key];
          if (validateValue(section, key, value)) {
            merged[section][key] = Array.isArray(value) ? [...value] : value;
          }
        }
      }
    }
  }

  return merged;
}

export function buildSettingsConfigPatch(currentConfig, body) {
  if (!isPlainObject(body)) {
    return { ok: false, error: 'Settings payload must be an object' };
  }

  const nextConfig = mergeSettingsConfig(currentConfig);

  for (const section of Object.keys(body)) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS_CONFIG, section)) {
      return { ok: false, error: `Unknown settings section: ${section}` };
    }

    if (!isPlainObject(body[section])) {
      return { ok: false, error: `Invalid settings section: ${section}` };
    }

    for (const key of Object.keys(body[section])) {
      if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS_CONFIG[section], key)) {
        return { ok: false, error: `Unknown settings key: ${section}.${key}` };
      }

      const value = body[section][key];
      if (!validateValue(section, key, value)) {
        return { ok: false, error: `Invalid settings value: ${section}.${key}` };
      }

      nextConfig[section][key] = Array.isArray(value) ? [...value] : value;
    }
  }

  return { ok: true, value: nextConfig };
}
