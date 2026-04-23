import assert from 'node:assert/strict';

import {
  canManageStaffRole,
  parsePaginationParams,
  validateAvatarDataUrl,
} from '../src/lib/api-safety.js';

function run() {
  assert.equal(canManageStaffRole('ADMIN', 'MANAGER'), true);
  assert.equal(canManageStaffRole('SUPER_ADMIN', 'MANAGER'), true);
  assert.equal(canManageStaffRole('MANAGER', 'SUPERVISOR'), true);
  assert.equal(canManageStaffRole('MANAGER', 'STAFF'), true);
  assert.equal(canManageStaffRole('MANAGER', 'MANAGER'), false);
  assert.equal(canManageStaffRole('STAFF', 'STAFF'), false);
  assert.equal(canManageStaffRole('CLIENT', 'STAFF'), false);

  const bounded = parsePaginationParams(new URLSearchParams('page=-3&limit=500'), {
    defaultLimit: 10,
  });
  assert.deepEqual(bounded, { page: 1, limit: 100, skip: 0 });

  const pageSize = parsePaginationParams(new URLSearchParams('page=3&pageSize=abc'), {
    defaultLimit: 25,
    pageSizeParam: 'pageSize',
  });
  assert.deepEqual(pageSize, { page: 3, limit: 25, skip: 50 });

  assert.deepEqual(validateAvatarDataUrl(null), { ok: true, value: null });
  assert.deepEqual(validateAvatarDataUrl(''), { ok: true, value: null });

  const validPng = `data:image/png;base64,${Buffer.from('avatar').toString('base64')}`;
  assert.deepEqual(validateAvatarDataUrl(validPng), { ok: true, value: validPng });

  assert.equal(validateAvatarDataUrl('https://example.com/avatar.png').ok, false);
  assert.equal(validateAvatarDataUrl('data:image/svg+xml;base64,PHN2Zy8+').ok, false);

  const tooLarge = `data:image/png;base64,${Buffer.alloc(512 * 1024 + 1).toString('base64')}`;
  assert.equal(validateAvatarDataUrl(tooLarge).ok, false);
}

run();
console.log('api safety tests passed');
