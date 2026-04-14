import assert from 'node:assert/strict';

import {
  buildVisitFormSections,
  getVisitFormAction,
} from '../src/components/care-delivery/edit-visit-forms.helpers.js';

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest('buildVisitFormSections splits templates into Required and Other and attaches matching forms', () => {
  const templates = [
    { id: 'tmpl-required', name: 'RN/LPN Documentation (Georgia)', isRequired: true },
    { id: 'tmpl-other', name: 'Patient Logs', isRequired: false },
    { id: 'tmpl-other-2', name: 'Physician Order Form', isRequired: false },
  ];

  const forms = [
    { id: 'form-1', templateId: 'tmpl-required', status: 'DRAFT' },
    { id: 'form-2', templateId: 'tmpl-other', status: 'SUBMITTED' },
  ];

  const sections = buildVisitFormSections(templates, forms);

  assert.equal(sections.required.length, 1);
  assert.equal(sections.other.length, 2);
  assert.equal(sections.required[0].form.id, 'form-1');
  assert.equal(sections.other[0].form.id, 'form-2');
  assert.equal(sections.other[1].form, null);
});

runTest('getVisitFormAction opens existing forms and fills in missing forms', () => {
  assert.deepEqual(
    getVisitFormAction({ id: 'tmpl-1', name: 'Patient Logs', form: { id: 'form-99', status: 'DRAFT' } }),
    { label: 'Open', formId: 'form-99', variant: 'primary' }
  );

  assert.deepEqual(
    getVisitFormAction({ id: 'tmpl-2', name: 'RN/LPN Documentation (Georgia)', form: null }),
    { label: 'Fill in', formId: null, variant: 'secondary' }
  );
});
