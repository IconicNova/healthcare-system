import assert from 'node:assert/strict';
import {
  getReviewableStatuses,
  canTransitionFormStatus,
  normalizeRejectionReason,
  buildReviewQueueFilters,
} from '../src/components/care-delivery/forms-review.helpers.js';

function run() {
  assert.deepEqual(getReviewableStatuses(), ['SUBMITTED', 'IN_REVIEW']);

  assert.equal(canTransitionFormStatus('SUBMITTED', 'IN_REVIEW', {}), true);
  assert.equal(canTransitionFormStatus('IN_REVIEW', 'APPROVED', {}), true);
  assert.equal(canTransitionFormStatus('DRAFT', 'APPROVED', {}), false);
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
}

run();
console.log('forms-review.helpers tests passed');
