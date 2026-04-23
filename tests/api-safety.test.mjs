import assert from 'node:assert/strict';

import {
  canManageStaffRole,
  CLIENT_MUTATION_ROLES,
  CLINICAL_ROLES,
  pickAllowedFields,
  parsePaginationParams,
  requireClinicalRole,
  validateAttachmentFile,
  validateAvatarDataUrl,
} from '../src/lib/api-safety.js';

async function run() {
  assert.equal(canManageStaffRole('ADMIN', 'MANAGER'), true);
  assert.equal(canManageStaffRole('SUPER_ADMIN', 'MANAGER'), true);
  assert.equal(canManageStaffRole('MANAGER', 'SUPERVISOR'), true);
  assert.equal(canManageStaffRole('MANAGER', 'STAFF'), true);
  assert.equal(canManageStaffRole('MANAGER', 'MANAGER'), false);
  assert.equal(canManageStaffRole('STAFF', 'STAFF'), false);
  assert.equal(canManageStaffRole('CLIENT', 'STAFF'), false);
  assert.deepEqual(CLINICAL_ROLES, ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'STAFF']);
  assert.deepEqual(CLIENT_MUTATION_ROLES, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);

  const forbidden = requireClinicalRole({ user: { role: 'CLIENT' } });
  assert.equal(forbidden.status, 403);
  const forbiddenBody = await forbidden.json();
  assert.deepEqual(forbiddenBody, { error: 'Forbidden' });

  assert.deepEqual(
    pickAllowedFields(
      {
        firstName: 'Ava',
        lastName: 'Jones',
        id: 'should-not-pass-through',
        status: undefined,
      },
      ['firstName', 'lastName', 'status']
    ),
    {
      firstName: 'Ava',
      lastName: 'Jones',
    }
  );

  const bounded = parsePaginationParams(new URLSearchParams('page=-3&limit=500'), {
    defaultLimit: 10,
  });
  assert.deepEqual(bounded, { page: 1, limit: 100, skip: 0 });

  const pageSize = parsePaginationParams(new URLSearchParams('page=3&pageSize=abc'), {
    defaultLimit: 25,
    pageSizeParam: 'pageSize',
  });
  assert.deepEqual(pageSize, { page: 3, limit: 25, skip: 50 });

  const capped = parsePaginationParams(new URLSearchParams('page=2&limit=5000'), {
    defaultLimit: 500,
    maxLimit: 1000,
  });
  assert.deepEqual(capped, { page: 2, limit: 1000, skip: 1000 });

  assert.deepEqual(validateAvatarDataUrl(null), { ok: true, value: null });
  assert.deepEqual(validateAvatarDataUrl(''), { ok: true, value: null });

  const validPng = `data:image/png;base64,${Buffer.from('avatar').toString('base64')}`;
  assert.deepEqual(validateAvatarDataUrl(validPng), { ok: true, value: validPng });

  assert.equal(validateAvatarDataUrl('https://example.com/avatar.png').ok, false);
  assert.equal(validateAvatarDataUrl('data:image/svg+xml;base64,PHN2Zy8+').ok, false);

  const tooLarge = `data:image/png;base64,${Buffer.alloc(512 * 1024 + 1).toString('base64')}`;
  assert.equal(validateAvatarDataUrl(tooLarge).ok, false);

  const pdfFile = { name: 'doc.pdf', type: 'application/pdf', size: 8 };
  assert.equal(
    validateAttachmentFile(pdfFile, Buffer.from('%PDF-1.7\n')).ok,
    true
  );
  assert.equal(
    validateAttachmentFile({ name: 'malware.exe', type: 'application/x-msdownload', size: 8 }, Buffer.from('MZ')).ok,
    false
  );
  assert.equal(
    validateAttachmentFile({ name: 'fake.png', type: 'image/png', size: 8 }, Buffer.from('%PDF-1.7\n')).ok,
    false
  );
}

await run();
console.log('api safety tests passed');
