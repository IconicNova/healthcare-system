export function normalizeFormStatus(status) {
  if (status === 'PENDING') return 'DRAFT';
  if (status === 'COMPLETED') return 'SUBMITTED';
  return status || 'DRAFT';
}

export function normalizeRejectionReason(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function getReviewableStatuses() {
  return ['SUBMITTED', 'IN_REVIEW'];
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

export function countSubmittedLikeStatuses(statuses = []) {
  return statuses.filter((status) =>
    ['SUBMITTED', 'IN_REVIEW', 'APPROVED'].includes(normalizeFormStatus(status))
  ).length;
}

export function shouldAutosaveDraft({ status, hasValidationErrors } = {}) {
  return normalizeFormStatus(status) === 'DRAFT' && Boolean(hasValidationErrors);
}

export function buildReviewMetadataPatch({
  previousStatus,
  nextStatus,
  rejectionReason,
  actorId,
  now = new Date(),
} = {}) {
  void previousStatus;

  const status = normalizeFormStatus(nextStatus);

  if (status === 'APPROVED') {
    return {
      status,
      approvedAt: now,
      approvedBy: actorId || null,
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: '',
    };
  }

  if (status === 'REJECTED') {
    return {
      status,
      approvedAt: null,
      approvedBy: null,
      rejectedAt: now,
      rejectedBy: actorId || null,
      rejectionReason: normalizeRejectionReason(rejectionReason),
    };
  }

  if (['DRAFT', 'SUBMITTED', 'IN_REVIEW'].includes(status)) {
    return {
      status,
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: '',
    };
  }

  return { status };
}
