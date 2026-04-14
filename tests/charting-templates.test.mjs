import assert from 'node:assert/strict';

import { chartingTemplates } from '../src/lib/charting-templates.js';

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest('charting templates include the tutorial-aligned required forms', () => {
  const names = chartingTemplates.map((template) => template.name);

  assert.ok(names.includes('RN/LPN Documentation (Georgia)'));
  assert.ok(names.includes('Patient Logs'));
  assert.ok(names.includes('Physician Order Form'));
});

runTest('charting templates expose at least one required form', () => {
  assert.ok(chartingTemplates.some((template) => template.isRequired));
});
