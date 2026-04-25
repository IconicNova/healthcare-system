import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRecurringVisitPayloads, getRecurrenceTotalVisits, validateRecurrence } from '../src/lib/recurrence.js';

test('weekly recurrence uses count as the canonical total when weeks is also present', () => {
  assert.equal(getRecurrenceTotalVisits({ type: 'WEEKLY', count: 4, weeks: 1 }), 4);
  assert.equal(validateRecurrence({ type: 'WEEKLY', count: 4, weeks: 1 }), null);
});

test('monthly recurrence clamps month-end dates instead of drifting forward', () => {
  const startTime = new Date(2025, 0, 31, 9, 0, 0, 0);
  const endTime = new Date(2025, 0, 31, 10, 0, 0, 0);

  const result = buildRecurringVisitPayloads({
    recurrence: { type: 'MONTHLY', count: 3 },
    baseData: { title: 'Monthly check-in' },
    startTime,
    endTime,
  });

  assert.equal(result.proposedVisits.length, 2);
  assert.equal(result.proposedVisits[0].startTime.getMonth(), 1);
  assert.equal(result.proposedVisits[0].startTime.getDate(), 28);
  assert.equal(result.proposedVisits[1].startTime.getMonth(), 2);
  assert.equal(result.proposedVisits[1].startTime.getDate(), 31);
});
