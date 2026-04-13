import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

/**
 * Get the encryption key from environment variable.
 * Key must be 32 bytes (64 hex characters).
 */
function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required for SSN encryption');
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns format: iv:ciphertext:authTag (all hex-encoded)
 * @param {string} plaintext
 * @returns {string} encrypted string
 */
export function encrypt(plaintext) {
  if (!plaintext) return null;

  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * Decrypt an encrypted string (iv:ciphertext:authTag format).
 * @param {string} encryptedString
 * @returns {string} decrypted plaintext
 */
export function decrypt(encryptedString) {
  if (!encryptedString) return null;

  // If it doesn't contain colons, it's already plaintext (legacy data)
  if (!encryptedString.includes(':')) {
    return encryptedString;
  }

  const key = getKey();
  const [ivHex, encrypted, authTagHex] = encryptedString.split(':');

  if (!ivHex || !encrypted || !authTagHex) {
    // Malformed encrypted string, return as-is (backward compatibility)
    return encryptedString;
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Mask an SSN for display (e.g., "123-45-6789" → "***-**-6789")
 * @param {string} ssn - plaintext or encrypted SSN
 * @returns {string} masked SSN
 */
export function maskSSN(ssn) {
  if (!ssn) return '';
  // Decrypt if encrypted
  const plain = ssn.includes(':') ? decrypt(ssn) : ssn;
  if (!plain || plain.length < 4) return '***-**-****';
  const lastFour = plain.replace(/\D/g, '').slice(-4);
  return `***-**-${lastFour}`;
}
