import assert from 'node:assert/strict';
import test from 'node:test';

import { buildMedicationAdministrationPayload, VALID_MEDICATION_ADMINISTRATION_STATUSES } from '../src/components/care-delivery/medication-administration.helpers.js';

test('medication administration payload normalizes status casing', () => {
  const payload = buildMedicationAdministrationPayload({
    status: 'held',
    reason: 'Client requested delay',
    visitId: 'visit-1',
  });

  assert.equal(payload.status, 'HELD');
  assert.equal(payload.reason, 'Client requested delay');
});

test('medication administration payload rejects unsupported statuses', () => {
  assert.throws(
    () => buildMedicationAdministrationPayload({
      status: 'adminsitered',
      visitId: 'visit-1',
    }),
    /Invalid medication administration status/
  );
});

test('medication administration payload requires a reason for non-administered statuses', () => {
  assert.throws(
    () => buildMedicationAdministrationPayload({
      status: 'HELD',
      visitId: 'visit-1',
    }),
    /A reason is required when medication is not administered/
  );
});

test('medication administration status set includes the accepted enum values', () => {
  assert.deepEqual([...VALID_MEDICATION_ADMINISTRATION_STATUSES].sort(), ['ADMINISTERED', 'HELD', 'NOT_GIVEN', 'REFUSED']);
});
