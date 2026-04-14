export function buildVisitFormSections(templates = [], forms = []) {
  const formsByTemplateId = new Map(
    forms.map((form) => [form.templateId, form])
  );

  const entries = templates.map((template) => ({
    ...template,
    form: formsByTemplateId.get(template.id) || null,
  }));

  return {
    required: entries.filter((entry) => entry.isRequired),
    other: entries.filter((entry) => !entry.isRequired),
  };
}

export function getVisitFormAction(templateEntry) {
  if (templateEntry?.form?.id) {
    return {
      label: 'Open',
      formId: templateEntry.form.id,
      variant: 'primary',
    };
  }

  return {
    label: 'Fill in',
    formId: null,
    variant: 'secondary',
  };
}
