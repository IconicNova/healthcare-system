import assert from 'node:assert/strict';
import {
  getReviewableStatuses,
  normalizeFormStatus,
  buildReviewMetadataPatch,
  shouldAutosaveDraft,
  countSubmittedLikeStatuses,
  canTransitionFormStatus,
  normalizeRejectionReason,
} from '../src/lib/form-review.js';
import { buildReviewQueueFilters } from '../src/components/care-delivery/forms-review.helpers.js';

function run() {
  assert.deepEqual(getReviewableStatuses(), ['SUBMITTED', 'IN_REVIEW']);

  assert.equal(canTransitionFormStatus('DRAFT', 'SUBMITTED', {}), true);
  assert.equal(canTransitionFormStatus('SUBMITTED', 'IN_REVIEW', {}), true);
  assert.equal(canTransitionFormStatus('IN_REVIEW', 'APPROVED', {}), true);
  assert.equal(canTransitionFormStatus('DRAFT', 'APPROVED', {}), false);
  assert.equal(
    canTransitionFormStatus('APPROVED', 'REJECTED', { rejectionReason: 'x' }),
    false
  );
  assert.equal(
    canTransitionFormStatus('SUBMITTED', 'REJECTED', { rejectionReason: '' }),
    false
  );
  assert.equal(
    canTransitionFormStatus('SUBMITTED', 'REJECTED', { rejectionReason: 'Missing signature' }),
    true
  );

  assert.equal(normalizeRejectionReason('  Missing signature  '), 'Missing signature');
  assert.equal(normalizeRejectionReason('   '), '');

  assert.deepEqual(
    buildReviewQueueFilters({
      status: 'SUBMITTED',
      clientId: 'client-1',
      templateId: 'template-1',
      dateFrom: '2026-04-01',
      dateTo: '2026-04-30',
    }),
    {
      status: 'SUBMITTED',
      clientId: 'client-1',
      templateId: 'template-1',
      dateFrom: '2026-04-01',
      dateTo: '2026-04-30',
    }
  );

  assert.deepEqual(
    buildReviewQueueFilters({
      status: 'SUBMITTED',
    }),
    {
      status: 'SUBMITTED',
      clientId: '',
      templateId: '',
      dateFrom: '',
      dateTo: '',
    }
  );

  assert.deepEqual(buildReviewQueueFilters(undefined), {
    status: '',
    clientId: '',
    templateId: '',
    dateFrom: '',
    dateTo: '',
  });

  assert.equal(normalizeFormStatus('PENDING'), 'DRAFT');
  assert.equal(normalizeFormStatus('COMPLETED'), 'SUBMITTED');
  assert.equal(normalizeFormStatus('SUBMITTED'), 'SUBMITTED');

  assert.deepEqual(
    buildReviewMetadataPatch({
      previousStatus: 'REJECTED',
      nextStatus: 'IN_REVIEW',
      rejectionReason: '',
      actorId: 'user-1',
    }),
    {
      status: 'IN_REVIEW',
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: '',
    }
  );

  assert.equal(
    shouldAutosaveDraft({ status: 'DRAFT', hasValidationErrors: true }),
    true
  );
  assert.equal(
    shouldAutosaveDraft({ status: 'SUBMITTED', hasValidationErrors: false }),
    false
  );

  assert.equal(
    countSubmittedLikeStatuses(['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED']),
    3
  );
}

run();
console.log('forms-review.helpers tests passed');
