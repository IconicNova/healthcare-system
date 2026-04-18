/**
 * Clinical Vitals Configuration
 * 
 * Defines normal, warning, and critical ranges for vital signs.
 * Used by VitalsEntryForm for validation and VitalsTab for indicators.
 */

export const VITAL_RANGES = {
  temperature: {
    label: 'Temperature',
    unit: '°F',
    altUnit: '°C',
    // Form input limits
    min: 70,
    max: 115,
    // Clinical ranges (Fahrenheit)
    normal: { min: 97.0, max: 99.5 },
    warning: { min: 95.0, max: 104.0 },
    critical: { min: 90.0, max: 108.0 },
    // Ranges for Celsius
    normalC: { min: 36.1, max: 37.5 },
    warningC: { min: 35.0, max: 40.0 },
    criticalC: { min: 32.2, max: 42.2 },
  },
  heartRate: {
    label: 'Heart Rate',
    unit: 'bpm',
    min: 20,
    max: 250,
    normal: { min: 60, max: 100 },
    warning: { min: 40, max: 180 },
    critical: { min: 30, max: 220 },
  },
  bloodPressureSystolic: {
    label: 'BP Systolic',
    unit: 'mmHg',
    min: 50,
    max: 260,
    normal: { min: 90, max: 140 },
    warning: { min: 70, max: 200 },
    critical: { min: 60, max: 250 },
  },
  bloodPressureDiastolic: {
    label: 'BP Diastolic',
    unit: 'mmHg',
    min: 30,
    max: 160,
    normal: { min: 60, max: 90 },
    warning: { min: 40, max: 120 },
    critical: { min: 35, max: 140 },
  },
  respiratoryRate: {
    label: 'Respiratory Rate',
    unit: 'rpm',
    min: 4,
    max: 60,
    normal: { min: 12, max: 20 },
    warning: { min: 8, max: 30 },
    critical: { min: 6, max: 50 },
  },
  oxygenSaturation: {
    label: 'O2 Saturation',
    unit: '%',
    min: 60,
    max: 100,
    normal: { min: 95, max: 100 },
    warning: { min: 90, max: 100 },
    critical: { min: 75, max: 100 },
  },
  painLevel: {
    label: 'Pain Level',
    unit: '/10',
    min: 0,
    max: 10,
    normal: { min: 0, max: 3 },
    warning: { min: 4, max: 7 },
    critical: { min: 8, max: 10 },
  },
  glucose: {
    label: 'Glucose',
    unit: 'mg/dL',
    min: 20,
    max: 600,
    normal: { min: 70, max: 140 },
    warning: { min: 54, max: 250 },
    critical: { min: 40, max: 400 },
  },
  weight: {
    label: 'Weight',
    unit: 'lbs',
    altUnit: 'kg',
    min: 1,
    max: 1000,
    normal: null,
    warning: null,
    critical: null,
  },
  height: {
    label: 'Height',
    unit: 'inches',
    min: 10,
    max: 120,
    normal: null,
    warning: null,
    critical: null,
  },
};

/**
 * Determines alert level for a given vital reading.
 * @returns {'normal'|'warning'|'critical'|'unknown'} 
 */
export function getVitalAlertLevel(vitalKey, value) {
  const config = VITAL_RANGES[vitalKey];
  if (!config || value == null || config.normal === null) return 'unknown';

  if (value >= config.normal.min && value <= config.normal.max) return 'normal';
  if (config.warning && (value < config.warning.min || value > config.warning.max)) return 'critical';
  if (value < config.normal.min || value > config.normal.max) return 'warning';
  return 'normal';
}

/**
 * Checks if a vital value is within the absolute input limits.
 * Values outside these limits are rejected outright.
 */
export function isVitalWithinLimits(vitalKey, value) {
  const config = VITAL_RANGES[vitalKey];
  if (!config || value == null) return true;
  return value >= config.min && value <= config.max;
}

/**
 * Gets a human-readable warning message for an abnormal vital.
 */
export function getVitalWarningMessage(vitalKey, value) {
  const level = getVitalAlertLevel(vitalKey, value);
  const config = VITAL_RANGES[vitalKey];
  if (!config) return null;

  if (level === 'critical') {
    return `${config.label} of ${value}${config.unit} is critically abnormal (normal: ${config.normal.min}-${config.normal.max}${config.unit}). Are you sure this is correct?`;
  }
  if (level === 'warning') {
    return `${config.label} of ${value}${config.unit} is outside normal range (${config.normal.min}-${config.normal.max}${config.unit}). Please verify.`;
  }
  return null;
}

/**
 * Vital types available for trend chart.
 * Now includes Weight since weight trends are clinically important.
 */
export const TREND_CHART_VITALS = [
  { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', color: '#EF4444' },
  { key: 'temperature', label: 'Temperature', unit: '°F', color: '#F59E0B' },
  { key: 'bloodPressureSystolic', label: 'BP Systolic', unit: 'mmHg', color: '#3B82F6' },
  { key: 'bloodPressureDiastolic', label: 'BP Diastolic', unit: 'mmHg', color: '#8B5CF6' },
  { key: 'oxygenSaturation', label: 'O2 Saturation', unit: '%', color: '#10B981' },
  { key: 'respiratoryRate', label: 'Respiratory Rate', unit: 'rpm', color: '#06B6D4' },
  { key: 'glucose', label: 'Glucose', unit: 'mg/dL', color: '#EC4899' },
  { key: 'weight', label: 'Weight', unit: 'lbs', color: '#6366F1' },
  { key: 'painLevel', label: 'Pain Level', unit: '/10', color: '#F97316' },
];

/**
 * Alert level color mapping for UI indicators.
 */
export const ALERT_COLORS = {
  normal: { color: '#10B981', bg: '#D1FAE5', label: 'Normal' },
  warning: { color: '#F59E0B', bg: '#FEF3C7', label: 'Abnormal' },
  critical: { color: '#EF4444', bg: '#FEE2E2', label: 'Critical' },
  unknown: { color: '#6B7280', bg: '#F3F4F6', label: '' },
};
