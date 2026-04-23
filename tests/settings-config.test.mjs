import assert from 'node:assert/strict';

import {
  DEFAULT_SETTINGS_CONFIG,
  buildSettingsConfigPatch,
  mergeSettingsConfig,
} from '../src/lib/settings-config.js';

function run() {
  assert.deepEqual(mergeSettingsConfig(null), DEFAULT_SETTINGS_CONFIG);

  assert.equal(
    mergeSettingsConfig({ scheduling: { defaultShiftLength: 12 } }).scheduling.defaultShiftLength,
    12
  );
  assert.equal(
    mergeSettingsConfig({ scheduling: { defaultShiftLength: 12 } }).scheduling.clockInWindow,
    DEFAULT_SETTINGS_CONFIG.scheduling.clockInWindow
  );

  const current = mergeSettingsConfig(null);
  const patchResult = buildSettingsConfigPatch(current, {
    billing: { taxRate: 5 },
    notifications: { lateClockInAlert: false },
  });
  assert.equal(patchResult.ok, true);
  assert.equal(patchResult.value.billing.taxRate, 5);
  assert.equal(patchResult.value.billing.paymentTerms, DEFAULT_SETTINGS_CONFIG.billing.paymentTerms);
  assert.equal(patchResult.value.notifications.lateClockInAlert, false);

  const unknown = buildSettingsConfigPatch(current, { security: { mfa: true } });
  assert.equal(unknown.ok, false);
  assert.match(unknown.error, /Unknown settings section/);

  const invalidType = buildSettingsConfigPatch(current, {
    scheduling: { defaultShiftLength: 'eight' },
  });
  assert.equal(invalidType.ok, false);
  assert.match(invalidType.error, /Invalid settings value/);
}

run();
console.log('settings config tests passed');
