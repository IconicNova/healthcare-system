import assert from 'node:assert/strict';
import test from 'node:test';

import { buildClientListWhere } from '../src/lib/client-list-filters.js';

test('default client list excludes discharged clients while preserving organization scope', () => {
  assert.deepEqual(
    buildClientListWhere({ organizationId: 'org-1', search: '', status: null }),
    {
      organizationId: 'org-1',
      status: { not: 'DISCHARGED' },
    }
  );
});

test('explicit discharged filter returns discharged clients only', () => {
  assert.deepEqual(
    buildClientListWhere({ organizationId: 'org-1', search: '', status: 'DISCHARGED' }),
    {
      organizationId: 'org-1',
      status: 'DISCHARGED',
    }
  );
});

test('search terms are combined with the default non-discharged filter', () => {
  assert.deepEqual(
    buildClientListWhere({ organizationId: 'org-1', search: 'Toronto', status: '' }),
    {
      organizationId: 'org-1',
      status: { not: 'DISCHARGED' },
      OR: [
        { firstName: { contains: 'Toronto', mode: 'insensitive' } },
        { lastName: { contains: 'Toronto', mode: 'insensitive' } },
        { email: { contains: 'Toronto', mode: 'insensitive' } },
        { phone: { contains: 'Toronto' } },
        { city: { contains: 'Toronto', mode: 'insensitive' } },
      ],
    }
  );
});

