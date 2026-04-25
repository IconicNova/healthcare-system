import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PasswordSchema,
  ProgressNotePatchSchema,
  SettingsOrganizationPatchSchema,
  SettingsServiceCreateSchema,
  SettingsServiceUpdateSchema,
  SettingsUserCreateSchema,
  SettingsUserUpdateSchema,
  VitalSignPatchSchema,
  VisitReportPatchSchema,
} from '../src/lib/validations.js';

test('password schema rejects weak passwords', () => {
  assert.equal(PasswordSchema.safeParse('short').success, false);
});

test('settings user create schema rejects invalid role and empty password', () => {
  const result = SettingsUserCreateSchema.safeParse({
    email: 'admin@example.com',
    password: 'password123',
    firstName: 'Ava',
    lastName: 'Stone',
    role: 'HACKER',
  });

  assert.equal(result.success, false);
});

test('settings user update schema rejects unknown fields', () => {
  const result = SettingsUserUpdateSchema.safeParse({
    firstName: 'Ava',
    createdAt: '2026-01-01T00:00:00.000Z',
  });

  assert.equal(result.success, false);
});

test('settings organization patch schema requires known editable fields only', () => {
  assert.equal(
    SettingsOrganizationPatchSchema.safeParse({ name: 'New Org', status: true }).success,
    false
  );
});

test('settings service create schema rejects negative rate and invalid duration', () => {
  assert.equal(
    SettingsServiceCreateSchema.safeParse({
      name: 'Night Shift',
      duration: -1,
      baseRate: -5,
    }).success,
    false
  );
});

test('settings service update schema rejects empty payload', () => {
  assert.equal(SettingsServiceUpdateSchema.safeParse({}).success, false);
});

test('progress note patch schema strips unknown ownership fields by rejecting them', () => {
  assert.equal(
    ProgressNotePatchSchema.safeParse({
      narrative: 'Updated note',
      clientId: 'malicious',
    }).success,
    false
  );
});

test('vital sign patch schema rejects ownership fields and accepts numeric updates', () => {
  assert.equal(
    VitalSignPatchSchema.safeParse({
      temperature: 98.6,
      recordedBy: 'evil-user',
    }).success,
    false
  );
  assert.equal(
    VitalSignPatchSchema.safeParse({
      temperature: 98.6,
      notes: 'Stable',
    }).success,
    true
  );
});

test('visit report patch schema rejects generatedBy and accepts visit lists', () => {
  assert.equal(
    VisitReportPatchSchema.safeParse({
      summary: 'Updated summary',
      generatedBy: 'evil-user',
    }).success,
    false
  );
  assert.equal(
    VisitReportPatchSchema.safeParse({
      summary: 'Updated summary',
      visitIds: ['550e8400-e29b-41d4-a716-446655440000'],
    }).success,
    true
  );
});
