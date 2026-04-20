import assert from 'node:assert/strict';

import {
  calculateStaffOverviewMetrics,
  getClientTotalVisits,
  getUserStatusFromStaffStatus,
  getStaffPayRateUnit,
} from '../src/lib/clients-staff-review.mjs';

assert.equal(getUserStatusFromStaffStatus('ACTIVE'), true);
assert.equal(getUserStatusFromStaffStatus('INACTIVE'), false);
assert.equal(getUserStatusFromStaffStatus('ON_LEAVE'), false);
assert.equal(getUserStatusFromStaffStatus('TERMINATED'), false);

assert.equal(getClientTotalVisits({ visits: Array.from({ length: 10 }), _count: { visits: 18 } }), 18);
assert.equal(getClientTotalVisits({ visits: Array.from({ length: 4 }) }), 4);
assert.equal(getClientTotalVisits({}), 0);

const metrics = calculateStaffOverviewMetrics([
  {
    status: 'COMPLETED',
    startTime: '2026-04-10T09:00:00.000Z',
    endTime: '2026-04-10T10:00:00.000Z',
    actualStart: '2026-04-10T09:10:00.000Z',
  },
  {
    status: 'COMPLETED',
    startTime: '2026-04-12T09:00:00.000Z',
    endTime: '2026-04-12T09:30:00.000Z',
    actualStart: '2026-04-12T09:45:00.000Z',
  },
  {
    status: 'SCHEDULED',
    startTime: '2026-04-15T09:00:00.000Z',
    endTime: '2026-04-15T09:30:00.000Z',
  },
], new Date('2026-04-18T00:00:00.000Z'));

assert.deepEqual(metrics, {
  totalVisits: 2,
  visitsThisMonth: 3,
  avgDuration: 45,
  punctualityRate: 50,
});

const emptyMetrics = calculateStaffOverviewMetrics([], new Date('2026-04-18T00:00:00.000Z'));
assert.equal(emptyMetrics.punctualityRate, null);
assert.equal(emptyMetrics.avgDuration, 0);

assert.equal(getStaffPayRateUnit('HOURLY'), 'hr');
assert.equal(getStaffPayRateUnit('PER_VISIT'), 'visit');
assert.equal(getStaffPayRateUnit('SALARY'), 'yr');

console.log('clients-staff-review assertions passed');
