import { normalizeFormSchema } from '@/lib/form-review';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function formatDateInputValue(dateValue) {
  if (!dateValue) return '';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTimeInputValue(dateValue) {
  if (!dateValue) return '';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getFullName(person = {}) {
  return [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
}

function getInitials(person = {}) {
  const initials = [person.firstName, person.lastName]
    .filter(Boolean)
    .map((part) => part.trim()[0]?.toUpperCase())
    .filter(Boolean)
    .join('');

  return initials || '';
}

function getVisitMoment(visit = {}) {
  return visit.actualStart || visit.startTime || visit.actualEnd || visit.endTime || '';
}

function pickExactOption(field, candidate) {
  if (!candidate || !Array.isArray(field?.options)) {
    return '';
  }

  const normalizedCandidate = String(candidate).trim().toLowerCase();
  return field.options.find(
    (option) => String(option).trim().toLowerCase() === normalizedCandidate
  ) || '';
}

function inferVisitType(field, sources) {
  const text = [
    sources.service?.name,
    sources.visit?.title,
    sources.visit?.description,
    sources.visit?.notes,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const candidates = [];

  if (text.includes('start of care') || text.includes('soc')) {
    candidates.push('Start of Care');
  }

  if (text.includes('recert')) {
    candidates.push('Recertification');
  }

  if (text.includes('prn')) {
    candidates.push('PRN Visit');
  }

  if (text.includes('routine')) {
    candidates.push('Routine Visit');
  }

  candidates.push(sources.service?.name, sources.visit?.title);

  for (const candidate of candidates) {
    const matched = pickExactOption(field, candidate);
    if (matched) {
      return matched;
    }
  }

  return '';
}

function resolveFieldPrefill(field, sources) {
  const name = normalizeKey(field?.name);
  const label = normalizeKey(field?.label);
  const combined = `${name} ${label}`;
  const visitDate = formatDateInputValue(getVisitMoment(sources.visit));
  const visitTime = formatTimeInputValue(getVisitMoment(sources.visit));
  const clientName = getFullName(sources.client);
  const clientInitials = getInitials(sources.client);
  const staffName = getFullName(sources.staff);
  const staffInitials = getInitials(sources.staff);
  const clientPhone = sources.client?.phone || '';
  const clientAddress = sources.client?.address || '';
  const clientCity = sources.client?.city || '';
  const clientState = sources.client?.state || '';
  const clientZip = sources.client?.zipCode || '';
  const clientDob = formatDateInputValue(sources.client?.dateOfBirth);

  if (!combined) return '';

  if (combined.includes('dateofbirth') || combined === 'dob') {
    return clientDob;
  }

  if (combined.includes('staffinitials')) {
    return staffInitials;
  }

  if (combined.includes('patientinitials') || combined.includes('clientinitials')) {
    return clientInitials;
  }

  if (combined.includes('clientname') || combined.includes('patientname')) {
    return clientName || clientInitials || '';
  }

  if (combined.includes('staffname') || combined.includes('cliniciansignature') || combined.includes('orderverifiedby')) {
    return staffName || staffInitials || '';
  }

  if (name === 'title' || label === 'title' || combined.endsWith('title')) {
    return sources.visit?.title || sources.service?.name || '';
  }

  if (combined.includes('primaryphone') || (combined.includes('phone') && !combined.includes('alternate'))) {
    return clientPhone;
  }

  if (
    name === 'address' ||
    name.endsWith('address') ||
    label === 'address' ||
    label.endsWith('address') ||
    combined.includes('streetaddress') ||
    combined.includes('mailingaddress')
  ) {
    return clientAddress;
  }

  if (combined.includes('city')) {
    return clientCity;
  }

  if (combined.includes('state')) {
    return clientState;
  }

  if (combined.includes('zip') || combined.includes('postal')) {
    return clientZip;
  }

  if (combined.includes('visittype')) {
    return inferVisitType(field, sources);
  }

  if (combined.includes('service')) {
    if (field?.type === 'select') {
      return pickExactOption(field, sources.service?.name);
    }

    return sources.service?.name || '';
  }

  if (combined.includes('visitdate') || (field?.type === 'date' && /visit|log|order|effective/.test(combined))) {
    return visitDate;
  }

  if (combined.includes('visittime') || (field?.type === 'time' && /visit|log/.test(combined))) {
    return visitTime;
  }

  if (
    combined.includes('summary') ||
    combined.includes('chiefcomplaint') ||
    combined.includes('assessment') ||
    combined.includes('description') ||
    combined.includes('notes')
  ) {
    return sources.visit?.description || sources.visit?.notes || sources.visit?.title || '';
  }

  return '';
}

export function buildFormPrefillData({ template, visit } = {}) {
  const schema = normalizeFormSchema(template?.schema);
  const sections = schema.sections || [];
  const sources = {
    visit: isPlainObject(visit) ? visit : {},
    client: isPlainObject(visit?.client) ? visit.client : {},
    staff: isPlainObject(visit?.staff) ? visit.staff : {},
    service: isPlainObject(visit?.service) ? visit.service : {},
    carePlan: isPlainObject(visit?.carePlan) ? visit.carePlan : {},
    branch: isPlainObject(visit?.branch) ? visit.branch : {},
  };

  return sections.reduce((prefill, section) => {
    (section.fields || []).forEach((field) => {
      if (!field?.name || prefill[field.name] !== undefined) {
        return;
      }

      const value = resolveFieldPrefill(field, sources);
      if (value !== '' && value !== null && value !== undefined) {
        prefill[field.name] = value;
      }
    });

    return prefill;
  }, {});
}

export function mergeFormDataWithPrefill({ template, visit, formData } = {}) {
  const prefill = buildFormPrefillData({ template, visit });
  return {
    ...prefill,
    ...(isPlainObject(formData) ? formData : {}),
  };
}
