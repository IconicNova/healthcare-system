import assert from 'node:assert/strict';
import { decrypt, encrypt, getEncryptionConfigurationError } from '../src/lib/encryption.js';

async function run() {
  const originalKey = process.env.ENCRYPTION_KEY;

  delete process.env.ENCRYPTION_KEY;
  assert.equal(
    getEncryptionConfigurationError(),
    'ENCRYPTION_KEY environment variable is required for SSN encryption',
    'expected a clear configuration error when the encryption key is missing'
  );

  process.env.ENCRYPTION_KEY = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';
  assert.equal(
    getEncryptionConfigurationError(),
    null,
    'expected a valid 32-byte hex key to be accepted'
  );

  process.env.ENCRYPTION_KEY = 'abc123';
  assert.equal(
    getEncryptionConfigurationError(),
    'ENCRYPTION_KEY must be a 64-character hex string (32 bytes)',
    'expected malformed keys to produce a clear configuration error'
  );

  process.env.ENCRYPTION_KEY = '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';
  const encrypted = encrypt('123-45-6789');
  assert.equal(typeof encrypted, 'string');
  assert.equal(decrypt(encrypted), '123-45-6789');

  assert.throws(
    () => decrypt('foo:bar'),
    /Malformed encrypted SSN|invalid/i,
    'expected malformed ciphertext to throw instead of falling back to plaintext'
  );

  if (originalKey === undefined) {
    delete process.env.ENCRYPTION_KEY;
  } else {
    process.env.ENCRYPTION_KEY = originalKey;
  }
}

await run();
console.log('encryption configuration tests passed');
