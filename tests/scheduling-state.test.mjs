import assert from 'node:assert/strict';

import {
  buildSchedulingStatusPillSections,
  buildSchedulingRange,
  buildSchedulingSearchParams,
  CORE_SCHEDULING_STATUSES,
  formatRecurrenceSummary,
  getCalendarViewForSlug,
  normalizeSchedulingViewSlug,
  normalizeVisitPayload,
  parseSchedulingDateParam,
  SECONDARY_SCHEDULING_STATUSES,
  validateRecurrence,
} from '../src/lib/scheduling.js';
import { VisitSchema } from '../src/lib/validations.js';

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest('normalizeSchedulingViewSlug falls back to month for invalid values', () => {
  assert.equal(normalizeSchedulingViewSlug('week'), 'week');
  assert.equal(normalizeSchedulingViewSlug('not-a-view'), 'month');
  assert.equal(normalizeSchedulingViewSlug(undefined), 'month');
});

runTest('getCalendarViewForSlug maps route views to FullCalendar views', () => {
  assert.equal(getCalendarViewForSlug('month'), 'dayGridMonth');
  assert.equal(getCalendarViewForSlug('week'), 'timeGridWeek');
  assert.equal(getCalendarViewForSlug('day'), 'timeGridDay');
});

runTest('parseSchedulingDateParam returns a safe fallback for invalid dates', () => {
  const parsed = parseSchedulingDateParam('2026-04-17');
  assert.equal(parsed.getFullYear(), 2026);
  assert.equal(parsed.getMonth(), 3);
  assert.equal(parsed.getDate(), 17);

  const fallback = new Date(2026, 3, 17, 10, 30, 0, 0);
  const invalid = parseSchedulingDateParam('bad-date', fallback);
  assert.equal(invalid.getFullYear(), 2026);
  assert.equal(invalid.getMonth(), 3);
  assert.equal(invalid.getDate(), 17);
});

runTest('buildSchedulingRange returns the visible month grid range', () => {
  const range = buildSchedulingRange('month', new Date(2026, 3, 17, 12, 0, 0, 0));

  assert.equal(range.start.getFullYear(), 2026);
  assert.equal(range.start.getMonth(), 2);
  assert.equal(range.start.getDate(), 29);
  assert.equal(range.end.getFullYear(), 2026);
  assert.equal(range.end.getMonth(), 4);
  assert.equal(range.end.getDate(), 9);
});

runTest('buildSchedulingSearchParams includes view date and active filters', () => {
  const params = buildSchedulingSearchParams({
    date: new Date(2026, 3, 17, 8, 0, 0, 0),
    filters: {
      staffId: 'staff-1',
      clientId: '',
      branchId: 'branch-2',
      status: 'SCHEDULED',
    },
  });

  assert.equal(params.get('date'), '2026-04-17');
  assert.equal(params.get('staffId'), 'staff-1');
  assert.equal(params.get('branchId'), 'branch-2');
  assert.equal(params.get('status'), 'SCHEDULED');
  assert.equal(params.has('clientId'), false);
});

runTest('buildSchedulingStatusPillSections keeps all core statuses visible and hides zero secondary statuses', () => {
  const sections = buildSchedulingStatusPillSections(
    {
      SCHEDULED: 3,
      COMPLETED: 2,
      APPROVED: 0,
      LATE: 1,
    },
    ''
  );

  assert.deepEqual(
    sections.coreStatuses.map((item) => item.status),
    CORE_SCHEDULING_STATUSES
  );
  assert.deepEqual(
    sections.secondaryStatuses.map((item) => item.status),
    ['COMPLETED', 'LATE']
  );
  assert.equal(sections.hasSecondaryStatuses, true);
  assert.equal(sections.activeSecondaryStatus, '');
});

runTest('buildSchedulingStatusPillSections preserves the active secondary filter in the overflow trigger', () => {
  const sections = buildSchedulingStatusPillSections(
    {
      SCHEDULED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    },
    'COMPLETED'
  );

  assert.equal(sections.activeSecondaryStatus, 'COMPLETED');
  assert.equal(sections.hasSecondaryStatuses, true);
  assert.deepEqual(
    sections.secondaryStatuses.map((item) => item.status),
    []
  );
  assert.deepEqual(SECONDARY_SCHEDULING_STATUSES.includes(sections.activeSecondaryStatus), true);
});

runTest('normalizeVisitPayload clears staff assignments for vacant visits', () => {
  assert.deepEqual(
    normalizeVisitPayload({
      staffId: 'staff-1',
      status: 'VACANT',
    }),
    {
      staffId: null,
      status: 'VACANT',
    }
  );
});

runTest('validateRecurrence requires an explicit duration for recurring visits', () => {
  assert.equal(validateRecurrence({ type: 'NONE' }), null);
  assert.equal(validateRecurrence({ type: 'WEEKLY' }), 'Weekly recurrence requires a number of weeks');
  assert.equal(validateRecurrence({ type: 'WEEKLY', weeks: 4 }), null);
});

runTest('formatRecurrenceSummary describes the visit series that will be created', () => {
  assert.equal(
    formatRecurrenceSummary({
      date: '2026-04-17',
      recurrence: { type: 'WEEKLY', weeks: 4 },
    }),
    'Creates 4 weekly visits from Apr 17, 2026 to May 8, 2026'
  );
});

runTest('VisitSchema accepts ON_HOLD as a supported visit status', () => {
  const parsed = VisitSchema.safeParse({
    clientId: '550e8400-e29b-41d4-a716-446655440000',
    staffId: null,
    serviceId: '550e8400-e29b-41d4-a716-446655440001',
    carePlanId: null,
    startTime: '2026-04-17T08:00:00.000Z',
    endTime: '2026-04-17T09:00:00.000Z',
    status: 'ON_HOLD',
    branchId: '550e8400-e29b-41d4-a716-446655440002',
  });

  assert.equal(parsed.success, true);
});
