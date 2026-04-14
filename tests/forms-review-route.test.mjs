import assert from 'node:assert/strict';
import { buildReviewQueueWhereClause } from '../src/lib/form-review.js';
import { buildReviewQueueFilters } from '../src/components/care-delivery/forms-review.helpers.js';

function run() {
  assert.deepEqual(
    buildReviewQueueWhereClause(
      'org-1',
      buildReviewQueueFilters({})
    ),
    {
      client: { organizationId: 'org-1' },
      status: { in: ['SUBMITTED', 'IN_REVIEW'] },
    }
  );

  assert.deepEqual(
    buildReviewQueueWhereClause(
      'org-1',
      buildReviewQueueFilters({
        status: 'APPROVED',
        clientId: 'client-1',
        templateId: 'template-1',
        dateFrom: '2026-04-01',
        dateTo: '2026-04-30',
      })
    ),
    {
      client: { organizationId: 'org-1' },
      status: 'APPROVED',
      clientId: 'client-1',
      templateId: 'template-1',
      submittedAt: {
        gte: new Date('2026-04-01T00:00:00.000Z'),
        lte: new Date('2026-04-30T23:59:59.999Z'),
      },
    }
  );
}

run();
console.log('forms-review-route tests passed');
