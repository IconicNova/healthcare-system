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

runTest('embedded forms review uses status and template filters on the first row', () => {
  const rows = buildFormsReviewFilterRows({ embedded: true });

  assert.deepEqual(rows[0].map((field) => field.key), ['status', 'template']);
  assert.deepEqual(rows[1].map((field) => field.key), ['dateRange']);
});

runTest('standalone forms review also omits the client filter', () => {
  const rows = buildFormsReviewFilterRows({ embedded: false });

  assert.deepEqual(rows[0].map((field) => field.key), ['status', 'template']);
});
