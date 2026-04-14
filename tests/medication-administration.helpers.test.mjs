import assert from 'node:assert/strict';

import {
  buildMedicationAdministrationPayload,
  formatAdministrationVisitLabel,
} from '../src/components/care-delivery/medication-administration.helpers.js';

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest('formats medication administration visits with service context', () => {
  const label = formatAdministrationVisitLabel({
    title: 'Morning Skilled Nursing',
    startTime: '2026-04-15T09:00:00.000Z',
    serviceName: 'Skilled Nursing',
  });

  assert.match(label, /Morning Skilled Nursing/);
  assert.match(label, /Skilled Nursing/);
  assert.match(label, /2026/);
});

runTest('builds a trimmed medication administration payload for administered events', () => {
  const payload = buildMedicationAdministrationPayload({
    status: 'ADMINISTERED',
    dosage: ' 1 ',
    unit: ' mL ',
    reason: ' ignored ',
    comment: ' after breakfast ',
    visitId: ' visit-123 ',
  });

  assert.deepEqual(payload, {
    status: 'ADMINISTERED',
    dosage: '1',
    unit: 'mL',
    reason: '',
    comment: 'after breakfast',
    visitId: 'visit-123',
  });
});

runTest('requires visit context for medication administration events', () => {
  assert.throws(
    () => buildMedicationAdministrationPayload({
      status: 'ADMINISTERED',
      dosage: '',
      unit: '',
      reason: '',
      comment: '',
      visitId: '',
    }),
    /linked visit is required/i
  );
});

runTest('requires reason when medication is not administered', () => {
  assert.throws(
    () => buildMedicationAdministrationPayload({
      status: 'REFUSED',
      dosage: '',
      unit: '',
      reason: '   ',
      comment: '',
      visitId: 'visit-123',
    }),
    /reason is required/i
  );
});
