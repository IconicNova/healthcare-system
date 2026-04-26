import assert from 'node:assert/strict';
import test from 'node:test';

import { buildBreadcrumbItems } from '../src/lib/breadcrumbs.js';

test('breadcrumb builder uses a registered label for UUID routes', () => {
  const pathname = '/clients/550e8400-e29b-41d4-a716-446655440000';
  const items = buildBreadcrumbItems(pathname, {
    [pathname]: 'Rainbow Lorikeet',
  });

  assert.equal(items.at(-1).label, 'Rainbow Lorikeet');
});

test('breadcrumb builder falls back to Details for unregistered UUID routes', () => {
  const items = buildBreadcrumbItems('/staff/550e8400-e29b-41d4-a716-446655440000');

  assert.equal(items.at(-1).label, 'Details');
});
