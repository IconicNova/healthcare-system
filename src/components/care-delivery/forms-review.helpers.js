export function getReviewableStatuses() {
  return ['SUBMITTED', 'IN_REVIEW'];
}

export function normalizeRejectionReason(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function canTransitionFormStatus(currentStatus, nextStatus, options = {}) {
  const validTransitions = {
    DRAFT: ['SUBMITTED'],
    SUBMITTED: ['IN_REVIEW', 'APPROVED', 'REJECTED'],
    IN_REVIEW: ['APPROVED', 'REJECTED'],
    APPROVED: [],
    REJECTED: ['IN_REVIEW'],
  };

  if (!(validTransitions[currentStatus] || []).includes(nextStatus)) {
    return false;
  }

  if (nextStatus === 'REJECTED') {
    return normalizeRejectionReason(options.rejectionReason).length > 0;
  }

  return true;
}

export function buildReviewQueueFilters(searchParams = {}) {
  return {
    status: searchParams.status || '',
    clientId: searchParams.clientId || '',
    templateId: searchParams.templateId || '',
    dateFrom: searchParams.dateFrom || '',
    dateTo: searchParams.dateTo || '',
  };
}
