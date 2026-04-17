import assert from 'node:assert/strict';
import {
  getReviewableStatuses,
  normalizeFormStatus,
  buildReviewMetadataPatch,
  hasMeaningfulFormContent,
  shouldAutosaveDraft,
  shouldOpenFormDetailFromReviewQueue,
  shouldScheduleFormAutosave,
  countSubmittedLikeStatuses,
  canTransitionFormStatus,
  normalizeRejectionReason,
} from '../src/lib/form-review.js';
import { buildCareDeliveryClientPath } from '../src/components/care-delivery/care-delivery.helpers.js';
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
      rejectionReason: null,
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
    shouldScheduleFormAutosave({ status: 'DRAFT', saving: false, saveStatus: 'idle' }),
    true
  );
  assert.equal(
    shouldScheduleFormAutosave({ status: 'APPROVED', saving: false, saveStatus: 'idle' }),
    false
  );
  assert.equal(
    shouldScheduleFormAutosave({ status: 'DRAFT', saving: true, saveStatus: 'idle' }),
    false
  );
  assert.equal(hasMeaningfulFormContent({}), false);
  assert.equal(hasMeaningfulFormContent({ notes: '   ' }), false);
  assert.equal(hasMeaningfulFormContent({ completed: false }), true);
  assert.equal(hasMeaningfulFormContent({ sections: [{ value: '' }, { value: 'done' }] }), true);
  assert.equal(
    shouldOpenFormDetailFromReviewQueue({ status: 'APPROVED', formData: {} }),
    false
  );
  assert.equal(
    shouldOpenFormDetailFromReviewQueue({ status: 'APPROVED', formData: { notes: 'Reviewed content' } }),
    true
  );
  assert.equal(
    shouldOpenFormDetailFromReviewQueue({ status: 'SUBMITTED', formData: {} }),
    true
  );

  assert.equal(
    buildCareDeliveryClientPath('client-1', 'forms-review'),
    '/care-delivery/client-1?tab=forms-review'
  );

  assert.equal(
    countSubmittedLikeStatuses(['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED']),
    4
  );
}

run();
console.log('forms-review.helpers tests passed');
