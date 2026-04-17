import assert from 'node:assert/strict';

import {
  CARE_DELIVERY_TABS,
  buildCareDeliveryClientPath,
  buildCareDeliveryFormPath,
  resolveCareDeliveryReturnTo,
} from '../src/components/care-delivery/care-delivery.helpers.js';

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest('care delivery tabs expose only supported client workspace sections', () => {
  assert.deepEqual(
    CARE_DELIVERY_TABS.map((tab) => tab.id),
    ['tasks', 'forms-review', 'progress', 'reports', 'vitals']
  );
});

runTest('buildCareDeliveryClientPath returns the client workspace route and optional tab query', () => {
  assert.equal(buildCareDeliveryClientPath('client-123'), '/care-delivery/client-123');
  assert.equal(
    buildCareDeliveryClientPath('client-123', 'vitals'),
    '/care-delivery/client-123?tab=vitals'
  );
});

runTest('buildCareDeliveryFormPath preserves return context for client workspaces', () => {
  assert.equal(
    buildCareDeliveryFormPath('form-9', '/care-delivery/client-123?tab=forms-review'),
    '/care-delivery/forms/form-9?returnTo=%2Fcare-delivery%2Fclient-123%3Ftab%3Dforms-review'
  );
});

runTest('resolveCareDeliveryReturnTo allows safe internal paths and rejects external ones', () => {
  assert.equal(
    resolveCareDeliveryReturnTo('/care-delivery/client-123?tab=tasks'),
    '/care-delivery/client-123?tab=tasks'
  );
  assert.equal(resolveCareDeliveryReturnTo('https://example.com/elsewhere'), '/care-delivery');
  assert.equal(resolveCareDeliveryReturnTo('javascript:alert(1)'), '/care-delivery');
});
