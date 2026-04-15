import assert from 'node:assert/strict';
import {
  CreateStaffSchema,
  UpdateStaffSchema,
  staffPhonePattern,
} from '../src/lib/validations.js';

function buildValidPayload() {
  return {
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: `emily.${Date.now()}@example.com`,
    password: 'password123',
    phone: '(416) 555-0198',
    branchId: '550e8400-e29b-41d4-a716-446655440000',
    hireDate: '2026-04-15',
    payRate: 45,
    payType: 'HOURLY',
    status: 'ACTIVE',
    role: 'STAFF',
    licenseNumber: 'RN-123456',
    licenseExpiry: '2027-12-31',
  };
}

function run() {
  const validPayload = buildValidPayload();
  const validResult = CreateStaffSchema.safeParse(validPayload);
  assert.equal(validResult.success, true, 'expected a well-formed staff payload to validate');

  const suspiciousNameResult = CreateStaffSchema.safeParse({
    ...buildValidPayload(),
    firstName: 'asdfasdfasdf',
    lastName: 'zzzzzzzz',
  });
  assert.equal(
    suspiciousNameResult.success,
    false,
    'expected spammy staff names to be rejected'
  );

  const weakPasswordResult = CreateStaffSchema.safeParse({
    ...buildValidPayload(),
    password: 'abcdefgh',
  });
  assert.equal(
    weakPasswordResult.success,
    false,
    'expected passwords without a number to be rejected'
  );

  assert.match(
    staffPhonePattern,
    /^\^.*\$$/,
    'expected exported phone pattern to stay anchored for the browser'
  );
  assert.equal(
    new RegExp(staffPhonePattern, 'v').test('(416) 555-0198'),
    true,
    'expected exported browser phone pattern to validate a canonical number'
  );
  assert.equal(
    new RegExp(staffPhonePattern, 'v').test('abc123'),
    false,
    'expected exported browser phone pattern to reject invalid input'
  );

  const partialUpdateResult = UpdateStaffSchema.safeParse({
    firstName: 'Maria',
    phone: '+1 416 555 0198',
  });
  assert.equal(partialUpdateResult.success, true, 'expected partial staff updates to validate');
}

run();
console.log('staff validation tests passed');
