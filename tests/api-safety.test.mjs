import assert from 'node:assert/strict';
import test from 'node:test';

import { ORGANIZATION_MEMBER_ROLES, requireOrgRole } from '../src/lib/api-safety.js';

test('organization member roles include super admin and clinical staff roles', () => {
  assert.deepEqual(ORGANIZATION_MEMBER_ROLES, [
    'SUPER_ADMIN',
    'ADMIN',
    'MANAGER',
    'SUPERVISOR',
    'STAFF',
  ]);
});

test('requireOrgRole allows super admin on organization member endpoints', () => {
  const session = {
    user: {
      id: 'user-1',
      role: 'SUPER_ADMIN',
      organizationId: 'org-1',
    },
  };

  assert.equal(requireOrgRole(session, ORGANIZATION_MEMBER_ROLES), null);
});
