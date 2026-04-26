import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getDisplayText,
  isMeaningfulText,
  normalizeDisplayText,
} from '../src/lib/display-text.js';

test('normalizeDisplayText treats placeholder clinical text as empty', () => {
  assert.equal(normalizeDisplayText('Nothing'), null);
  assert.equal(normalizeDisplayText('  N/A  '), null);
  assert.equal(normalizeDisplayText('none'), null);
});

test('isMeaningfulText rejects blank placeholder values', () => {
  assert.equal(isMeaningfulText('   '), false);
  assert.equal(isMeaningfulText('Nothing'), false);
  assert.equal(isMeaningfulText('Post-op wound care'), true);
});

test('getDisplayText returns a fallback for non-meaningful values', () => {
  assert.equal(getDisplayText('Nothing', 'No description provided'), 'No description provided');
  assert.equal(getDisplayText('Medication review', 'No description provided'), 'Medication review');
});
