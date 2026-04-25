import assert from 'node:assert/strict';
import test from 'node:test';

import { encrypt, maskSSN } from '../src/lib/encryption.js';

test('maskSSN hides all but the final four digits for plaintext values', () => {
  assert.equal(maskSSN('123-45-6789'), '***-**-6789');
});

test('maskSSN hides encrypted SSNs as well', () => {
  const previousKey = process.env.ENCRYPTION_KEY;
  process.env.ENCRYPTION_KEY = 'a'.repeat(64);

  try {
    const encrypted = encrypt('123-45-6789');
    assert.equal(maskSSN(encrypted), '***-**-6789');
  } finally {
    process.env.ENCRYPTION_KEY = previousKey;
  }
});
