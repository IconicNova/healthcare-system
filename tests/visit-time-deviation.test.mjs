import assert from 'node:assert/strict';
import test from 'node:test';

import { getVisitTimeDeviationWarning } from '../src/lib/visit-time-deviation.js';

test('visit time deviation helper stays quiet when actual times are missing', () => {
  const warning = getVisitTimeDeviationWarning({
    startTime: '2026-04-26T09:00:00.000Z',
    endTime: '2026-04-26T10:00:00.000Z',
  });

  assert.equal(warning, null);
});

test('visit time deviation helper stays quiet within the threshold', () => {
  const warning = getVisitTimeDeviationWarning({
    startTime: '2026-04-26T09:00:00.000Z',
    endTime: '2026-04-26T10:00:00.000Z',
    actualStart: '2026-04-26T09:15:00.000Z',
    actualEnd: '2026-04-26T10:10:00.000Z',
  });

  assert.equal(warning, null);
});

test('visit time deviation helper flags a late start and short duration', () => {
  const warning = getVisitTimeDeviationWarning({
    startTime: '2026-04-26T09:00:00.000Z',
    endTime: '2026-04-26T10:00:00.000Z',
    actualStart: '2026-04-26T19:18:00.000Z',
    actualEnd: '2026-04-26T19:24:00.000Z',
  });

  assert.ok(warning);
  assert.equal(warning.type, 'time-deviation');
  assert.match(warning.message, /start/i);
  assert.match(warning.message, /duration/i);
});
