import assert from 'node:assert/strict';
import test from 'node:test';

import { buildEvvSummary, buildWeeklyVisitChartData } from '../src/lib/dashboard-summary.helpers.js';

test('weekly chart helper counts only scheduled and completed statuses', () => {
  const startOfWeek = new Date(2025, 3, 20, 0, 0, 0, 0);
  const data = buildWeeklyVisitChartData([
    { startTime: new Date(2025, 3, 20, 9, 0, 0, 0), status: 'SCHEDULED' },
    { startTime: new Date(2025, 3, 20, 10, 0, 0, 0), status: 'CANCELLED' },
    { startTime: new Date(2025, 3, 20, 11, 0, 0, 0), status: 'COMPLETED' },
  ], startOfWeek);

  assert.equal(data[0].scheduled, 1);
  assert.equal(data[0].completed, 1);
});

test('EVV summary counts only visits with both timestamps present', () => {
  const summary = buildEvvSummary([
    { actualStart: new Date(), actualEnd: new Date() },
    { actualStart: new Date(), actualEnd: null },
  ]);

  assert.deepEqual(summary, {
    verified: 1,
    unverified: 1,
    rate: 50,
  });
});
