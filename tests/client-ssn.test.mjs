import assert from 'node:assert/strict';
import {
  isMaskedSsn,
  normalizeSsnForSubmission,
  shouldValidateSsn,
} from '../src/lib/client-ssn.js';

function run() {
  assert.equal(
    isMaskedSsn('***-**-6789'),
    true,
    'expected masked SSNs from the edit screen to be recognized'
  );

  assert.equal(
    shouldValidateSsn('***-**-6789'),
    false,
    'expected unchanged masked SSNs to skip client-side SSN validation'
  );

  assert.equal(
    normalizeSsnForSubmission('***-**-6789'),
    undefined,
    'expected unchanged masked SSNs to be omitted from PATCH payloads'
  );

  assert.equal(
    shouldValidateSsn('123-45-6789'),
    true,
    'expected real SSN edits to still be validated'
  );

  assert.equal(
    normalizeSsnForSubmission('123-45-6789'),
    '123-45-6789',
    'expected edited SSNs to be submitted verbatim'
  );

  assert.equal(
    normalizeSsnForSubmission(''),
    '',
    'expected clearing the SSN field to remain an explicit clear action'
  );
}

run();
console.log('client ssn helper tests passed');
