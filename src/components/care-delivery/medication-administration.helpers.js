function trimText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

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
  const reason = status === 'ADMINISTERED' ? '' : trimText(data?.reason);
  const comment = trimText(data?.comment);
  const visitId = trimText(data?.visitId);

  if (!status) {
    throw new Error('Medication administration status is required.');
  }

  if (!visitId) {
    throw new Error('A linked visit is required for medication administration.');
  }

  if (status !== 'ADMINISTERED' && !reason) {
    throw new Error('A reason is required when medication is not administered.');
  }

  return {
    status,
    dosage,
    unit,
    reason,
    comment,
    visitId,
  };
}
