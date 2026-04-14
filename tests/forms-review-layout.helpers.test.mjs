import assert from 'node:assert/strict';

import { buildFormsReviewFilterRows } from '../src/components/care-delivery/forms-review-layout.helpers.js';

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest('embedded forms review uses two deliberate filter rows', () => {
  const rows = buildFormsReviewFilterRows({ embedded: true, clientLocked: true });

  assert.deepEqual(rows[0].map((field) => field.key), ['status', 'client', 'template']);
  assert.deepEqual(rows[1].map((field) => field.key), ['dateRange']);
  assert.equal(rows[0][1].disabled, true);
});

runTest('standalone forms review keeps client filter unlocked', () => {
  const rows = buildFormsReviewFilterRows({ embedded: false, clientLocked: false });

  assert.deepEqual(rows[0].map((field) => field.key), ['status', 'client', 'template']);
  assert.equal(rows[0][1].disabled, false);
});
