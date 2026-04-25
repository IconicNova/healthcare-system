import assert from 'node:assert/strict';
import test from 'node:test';

import { VISIT_MANAGEMENT_ROLES } from '../src/lib/visit-access.js';

test('visit detail access includes admin and other care-delivery roles', () => {
  assert.deepEqual(
    VISIT_MANAGEMENT_ROLES,
    ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF']
  );
});
