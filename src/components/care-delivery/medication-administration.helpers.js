function trimText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export const VALID_MEDICATION_ADMINISTRATION_STATUSES = new Set([
  'ADMINISTERED',
  'HELD',
  'REFUSED',
  'NOT_GIVEN',
]);

const REQUIRED_SAFETY_CHECKS = [
  'rightPatient',
  'rightMedication',
  'rightDose',
  'rightRoute',
  'rightTime',
  'allergyReviewed',
];

export function formatAdministrationVisitLabel(visit) {
  const title = trimText(visit?.title) || 'Scheduled Visit';
  const serviceName = trimText(visit?.serviceName);
  const when = visit?.startTime
    ? new Date(visit.startTime).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : 'No scheduled time';

  return serviceName
    ? `${title} • ${serviceName} • ${when}`
    : `${title} • ${when}`;
}

export function buildMedicationAdministrationPayload(data) {
  const status = trimText(data?.status).toUpperCase();
  const dosage = trimText(data?.dosage);
  const unit = trimText(data?.unit);
  const expectedDosage = trimText(data?.expectedDosage);
  const expectedUnit = trimText(data?.expectedUnit);
  const reason = status === 'ADMINISTERED' ? '' : trimText(data?.reason);
  const comment = trimText(data?.comment);
  const visitId = trimText(data?.visitId);
  const safetyChecks = data?.safetyChecks && typeof data.safetyChecks === 'object' ? data.safetyChecks : null;

  if (!status) {
    throw new Error('Medication administration status is required.');
  }

  if (!VALID_MEDICATION_ADMINISTRATION_STATUSES.has(status)) {
    throw new Error('Invalid medication administration status.');
  }

  if (!visitId) {
    throw new Error('A linked visit is required for medication administration.');
  }

  if (status !== 'ADMINISTERED' && !reason) {
    throw new Error('A reason is required when medication is not administered.');
  }

  if (status === 'ADMINISTERED') {
    if (!safetyChecks) {
      throw new Error('Safety confirmation is required before administering medication.');
    }

    const missingCheck = REQUIRED_SAFETY_CHECKS.find((check) => safetyChecks[check] !== true);
    if (missingCheck) {
      throw new Error('All medication safety checks must be acknowledged before administering.');
    }

    if (expectedDosage) {
      const expectedLabel = [expectedDosage, expectedUnit].filter(Boolean).join(' ').trim().toLowerCase();
      const enteredLabel = [dosage, unit].filter(Boolean).join(' ').trim().toLowerCase();
      if (expectedLabel && enteredLabel && expectedLabel !== enteredLabel && safetyChecks.doseConfirmed !== true) {
        throw new Error('Dose confirmation is required when the administered dose differs from the medication order.');
      }
    }
  }

  return {
    status,
    dosage,
    unit,
    expectedDosage,
    expectedUnit,
    reason,
    comment,
    visitId,
    safetyChecks,
  };
}
