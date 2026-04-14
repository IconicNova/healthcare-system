import { normalizeRejectionReason } from '../components/care-delivery/forms-review.helpers.js';

export function normalizeFormStatus(status) {
  if (status === 'PENDING') return 'DRAFT';
  if (status === 'COMPLETED') return 'SUBMITTED';
  return status || 'DRAFT';
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
