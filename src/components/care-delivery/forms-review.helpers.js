export function getReviewableStatuses() {
  return ['SUBMITTED', 'IN_REVIEW'];
}

export function normalizeRejectionReason(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function canTransitionFormStatus(currentStatus, nextStatus, options = {}) {
  if (currentStatus === 'DRAFT' && nextStatus !== 'SUBMITTED') {
    return false;
  }

  if (nextStatus === 'REJECTED') {
    return normalizeRejectionReason(options.rejectionReason).length > 0;
  }

  const validTransitions = {
    DRAFT: ['SUBMITTED'],
    SUBMITTED: ['IN_REVIEW', 'APPROVED', 'REJECTED'],
    IN_REVIEW: ['APPROVED', 'REJECTED'],
    APPROVED: [],
    REJECTED: ['IN_REVIEW'],
  };

  return (validTransitions[currentStatus] || []).includes(nextStatus);
}

export function buildReviewQueueFilters(searchParams) {
  return {
    status: searchParams.status || '',
    clientId: searchParams.clientId || '',
    templateId: searchParams.templateId || '',
    dateFrom: searchParams.dateFrom || '',
    dateTo: searchParams.dateTo || '',
  };
}
