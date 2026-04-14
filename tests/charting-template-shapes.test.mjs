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

function getTemplate(name) {
  return chartingTemplates.find((template) => template.name === name);
}

runTest('RN/LPN Documentation (Georgia) has multi-section clinical charting depth', () => {
  const template = getTemplate('RN/LPN Documentation (Georgia)');

  assert.ok(template);
  assert.ok(template.schema.sections.length >= 4);
  assert.ok(template.schema.sections.some((section) => section.name === 'Clinical Assessment'));
  assert.ok(template.schema.sections.some((section) => section.name === 'Interventions & Coordination'));

  const fieldNames = template.schema.sections.flatMap((section) => section.fields.map((field) => field.name));
  assert.ok(fieldNames.includes('bloodPressure'));
  assert.ok(fieldNames.includes('respiratoryStatus'));
  assert.ok(fieldNames.includes('careCoordinationNotes'));
  assert.ok(fieldNames.includes('clinicianSignature'));
});

runTest('Patient Logs includes observation, ADL, and communication capture', () => {
  const template = getTemplate('Patient Logs');

  assert.ok(template);
  assert.ok(template.schema.sections.length >= 3);

  const fieldNames = template.schema.sections.flatMap((section) => section.fields.map((field) => field.name));
  assert.ok(fieldNames.includes('adlsAddressed'));
  assert.ok(fieldNames.includes('clientMood'));
  assert.ok(fieldNames.includes('familyCommunication'));
});

runTest('Physician Order Form captures order metadata and follow-up workflow', () => {
  const template = getTemplate('Physician Order Form');

  assert.ok(template);
  assert.ok(template.schema.sections.length >= 3);

  const fieldNames = template.schema.sections.flatMap((section) => section.fields.map((field) => field.name));
  assert.ok(fieldNames.includes('orderType'));
  assert.ok(fieldNames.includes('effectiveDate'));
  assert.ok(fieldNames.includes('agencyFollowUpPlan'));
});
