import { z } from 'zod';

const canadianPhoneRegex = /^\+?1?(?:\.|\s|-)?\(?([0-9]{3})\)?(?:\.|\s|-)?([0-9]{3})(?:\.|\s|-)?([0-9]{4})$/;
const northAmericanPostalCodeRegex = /^(?:\d{5}(?:-\d{4})?|[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d)$/;
const htmlDateInputRegex = /^\d{4}-\d{2}-\d{2}$/;
const humanNameRegex = /^[\p{L}](?:[\p{L}' .-]*[\p{L}])?$/u;
const suspiciousNameFragments = ['asdf', 'qwer', 'zxcv', 'poiuy', 'lkjh', 'mnbv'];
const clientGenderValues = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY', 'Male', 'Female', 'Other', 'Prefer not to say'];

export const staffPhonePattern = '^\\+?1?(?:\\.|\\s|-)?\\(?([0-9]{3})\\)?(?:\\.|\\s|-)?([0-9]{3})(?:\\.|\\s|-)?([0-9]{4})$';

const minDateRefinement = [
  (val) => !val || new Date(val) >= new Date('1900-01-01'),
  { message: "Date is exceptionally too far in the past" }
];

function collapseWhitespace(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function hasRepeatedChunk(value) {
  for (let size = 2; size <= Math.floor(value.length / 3); size += 1) {
    const chunk = value.slice(0, size);
    if (chunk.repeat(Math.floor(value.length / size)) === value) {
      return true;
    }
  }

  return false;
}

function looksSuspiciouslyGarbledName(value) {
  const normalized = value.toLowerCase().replace(/[\s'.-]/g, '');

  if (!normalized) {
    return false;
  }

  if (/(.)\1{3,}/.test(normalized)) {
    return true;
  }

  if (normalized.length >= 6 && hasRepeatedChunk(normalized)) {
    return true;
  }

  return suspiciousNameFragments.some((fragment) => normalized.includes(fragment));
}

function buildHumanNameSchema(fieldLabel) {
  return z.string()
    .trim()
    .min(1, `${fieldLabel} is required`)
    .max(50, `${fieldLabel} must be 50 characters or fewer`)
    .transform(collapseWhitespace)
    .refine((value) => humanNameRegex.test(value), {
      message: `${fieldLabel} can only include letters, spaces, apostrophes, periods, and hyphens`,
    })
    .refine((value) => !looksSuspiciouslyGarbledName(value), {
      message: `${fieldLabel} looks invalid or spammy`,
    });
}

const normalizedEmailSchema = z.string()
  .trim()
  .min(1, 'Email is required')
  .max(255, 'Email must be 255 characters or fewer')
  .email('Invalid email format')
  .transform((value) => value.toLowerCase());

const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .max(100, 'Password must be 100 characters or fewer')
  .refine((value) => /[A-Za-z]/.test(value), {
    message: 'Password must include at least one letter',
  })
  .refine((value) => /[A-Z]/.test(value), {
    message: 'Password must include at least one uppercase letter',
  })
  .refine((value) => /[a-z]/.test(value), {
    message: 'Password must include at least one lowercase letter',
  })
  .refine((value) => /\d/.test(value), {
    message: 'Password must include at least one number',
  })
  .refine((value) => /[^A-Za-z0-9]/.test(value), {
    message: 'Password must include at least one symbol',
  })
  .refine((value) => !/\s/.test(value), {
    message: 'Password cannot contain spaces',
  });

export const PasswordSchema = passwordSchema;

const optionalText = (maxLength) => z.string().trim().max(maxLength).optional().nullable();
const patchHasAnyValue = (value) => Object.values(value).some((entry) => entry !== undefined);

const optionalDateSchema = z.union([z.string(), z.date()])
  .refine(...minDateRefinement)
  .optional()
  .nullable();

const staffBaseSchema = z.object({
  firstName: buildHumanNameSchema('First name'),
  lastName: buildHumanNameSchema('Last name'),
  email: normalizedEmailSchema,
  phone: z.string()
    .trim()
    .regex(canadianPhoneRegex, 'Invalid North American phone format'),
  role: z.enum(['STAFF', 'SUPERVISOR', 'MANAGER'], {
    errorMap: () => ({ message: 'Role is required' }),
  }),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']).default('ACTIVE'),
  payType: z.enum(['HOURLY', 'SALARY', 'PER_VISIT']).default('HOURLY'),
  payRate: z.number().min(0, 'Pay rate must be 0 or greater').optional().nullable(),
  branchId: z.string().uuid('Branch is required'),
  hireDate: optionalDateSchema,
  licenseNumber: z.string().trim().max(50, 'License number must be 50 characters or fewer').optional().nullable(),
  licenseExpiry: optionalDateSchema,
});

export const CreateStaffSchema = staffBaseSchema.extend({
  password: passwordSchema,
});

export const UpdateStaffSchema = staffBaseSchema.partial().extend({
  password: passwordSchema.optional(),
});

function extractFirstError(fieldErrors) {
  for (const messages of Object.values(fieldErrors)) {
    if (Array.isArray(messages) && messages.length > 0) {
      return messages[0];
    }
  }

  return 'Validation failed';
}

export function normalizeStaffFormData(formData) {
  const normalizedPayRate =
    formData.payRate === '' || formData.payRate === null || formData.payRate === undefined
      ? null
      : Number(formData.payRate);
  const normalizedPassword = formData.password?.trim() ? formData.password : undefined;

  return {
    firstName: formData.firstName ?? '',
    lastName: formData.lastName ?? '',
    email: formData.email ?? '',
    password: normalizedPassword,
    phone: formData.phone ?? '',
    branchId: formData.branchId ?? '',
    hireDate: formData.hireDate || null,
    payRate: Number.isFinite(normalizedPayRate) ? normalizedPayRate : Number.NaN,
    payType: formData.payType ?? 'HOURLY',
    status: formData.status ?? 'ACTIVE',
    role: formData.role ?? 'STAFF',
    licenseNumber: formData.licenseNumber?.trim() ? formData.licenseNumber.trim() : null,
    licenseExpiry: formData.licenseExpiry || null,
  };
}

export function validateStaffFormData(formData, { isEdit = false } = {}) {
  const normalizedData = normalizeStaffFormData(formData);
  const schema = isEdit ? UpdateStaffSchema : CreateStaffSchema;
  const validationResult = schema.safeParse(normalizedData);

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    return {
      success: false,
      fieldErrors,
      firstError: extractFirstError(fieldErrors),
      data: null,
    };
  }

  if ((formData.password ?? '') !== (formData.confirmPassword ?? '')) {
    return {
      success: false,
      fieldErrors: { confirmPassword: ['Passwords do not match'] },
      firstError: 'Passwords do not match',
      data: null,
    };
  }

  return {
    success: true,
    fieldErrors: {},
    firstError: null,
    data: validationResult.data,
  };
}

export const ClientSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email format").max(255).optional().nullable().or(z.literal('')),
  phone: z.string()
    .regex(canadianPhoneRegex, "Invalid North American phone format")
    .optional()
    .nullable()
    .or(z.literal('')),
  dateOfBirth: z.union([
    z.string().datetime(),
    z.string().regex(htmlDateInputRegex, "Invalid date format"),
    z.date(),
    z.literal(''),
  ])
    .refine(...minDateRefinement)
    .optional()
    .nullable(),
  gender: z.enum(clientGenderValues).optional().nullable().or(z.literal('')),
  ssn: z.string().refine(val => !val || /^(\d{3}-\d{2}-\d{4}|\d{9})$/.test(val), {
    message: "Invalid SSN format"
  }).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  city: z.string().max(50).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  zipCode: z.string()
    .regex(northAmericanPostalCodeRegex, "Invalid ZIP or Postal Code format")
    .optional()
    .nullable()
    .or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'ON_HOLD', 'DISCHARGED']).optional()
});

export const StaffSchema = CreateStaffSchema;

export const VisitSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  staffId: z.string().uuid("Invalid staff ID").optional().nullable(),
  serviceId: z.string().uuid("Invalid service ID").optional().nullable(),
  carePlanId: z.string().uuid("Invalid care plan ID").optional().nullable(),
  startTime: z.string().datetime().or(z.date()).refine(...minDateRefinement),
  endTime: z.string().datetime().or(z.date()).refine(...minDateRefinement),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'MISSED', 'CLOCKED_IN', 'OFFERED', 'VACANT', 'ON_HOLD']).optional(),
  title: z.string().max(255).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  branchId: z.string().uuid().optional().nullable()
});

export const InvoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(1000),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price must be positive")
});

export const InvoiceSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  amount: z.number().min(0, "Amount must be positive").optional(), // Computed on backend usually
  dueDate: z.string().datetime().or(z.date()).refine(...minDateRefinement),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  notes: z.string().max(2000).optional().nullable(),
  invoiceItems: z.array(InvoiceItemSchema).min(1, "At least one invoice item is required").optional()
});

// ─── CARE DELIVERY VALIDATION SCHEMAS ───────────────────────────────

export const ProgressNoteSchema = z.object({
  clientId: z.string().uuid(),
  visitId: z.string().uuid().optional().nullable(),
  type: z.enum(['SOAP', 'DAP', 'NARRATIVE', 'INCIDENT']),
  subjective: z.string().max(2000).optional().nullable(),
  objective: z.string().max(2000).optional().nullable(),
  assessment: z.string().max(2000).optional().nullable(),
  plan: z.string().max(2000).optional().nullable(),
  narrative: z.string().max(10000).optional().nullable()
}).refine(data => {
  if (data.type === 'SOAP') {
    return data.subjective || data.objective || data.assessment || data.plan;
  }
  if (data.type === 'DAP' || data.type === 'NARRATIVE') {
    return data.narrative && data.narrative.trim().length > 0;
  }
  // INCIDENT type: narrative is required (incident details are packed into narrative)
  if (data.type === 'INCIDENT') {
    return data.narrative && data.narrative.trim().length > 0;
  }
  return true;
}, { message: 'At least one content field is required for this note type' });

export const VitalSignSchema = z.object({
  clientId: z.string().uuid(),
  visitId: z.string().uuid().optional().nullable(),
  temperature: z.number().min(70).max(115).optional().nullable(),
  temperatureUnit: z.string().optional().nullable(),
  bloodPressureSystolic: z.number().min(50).max(260).optional().nullable(),
  bloodPressureDiastolic: z.number().min(30).max(160).optional().nullable(),
  heartRate: z.number().min(20).max(250).optional().nullable(),
  respiratoryRate: z.number().min(4).max(60).optional().nullable(),
  oxygenSaturation: z.number().min(60).max(100).optional().nullable(),
  painLevel: z.number().min(0).max(10).optional().nullable(),
  weight: z.number().min(1).max(1000).optional().nullable(),
  weightUnit: z.string().optional().nullable(),
  height: z.number().min(10).max(120).optional().nullable(),
  heightUnit: z.string().optional().nullable(),
  bmi: z.number().min(0).max(100).optional().nullable(),
  glucose: z.number().min(20).max(600).optional().nullable(),
  glucoseUnit: z.string().optional().nullable(),
  recordedAt: z.string().datetime().or(z.date()).optional()
});

export const VisitReportSchema = z.object({
  clientId: z.string().uuid(),
  type: z.enum(['VISIT_SUMMARY', 'PERIOD_SUMMARY']),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional().nullable(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  summary: z.string().max(5000).optional().nullable(),
  clientCondition: z.string().max(2000).optional().nullable(),
  notableEvents: z.string().max(2000).optional().nullable(),
  recommendations: z.string().max(2000).optional().nullable(),
  visitIds: z.array(z.string().uuid()).optional()
});

export const CarePlanServiceSchema = z.object({
  serviceId: z.string().uuid('Service is required'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'AS_NEEDED', 'CUSTOM']).optional(),
  frequencyText: z.string().max(255).optional().nullable(),
  instructions: z.string().max(1000).optional().nullable(),
  order: z.number().int().min(0).optional(),
}).strict();

export const CarePlanCreateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: optionalText(1000),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()).optional().nullable(),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'DISCHARGED', 'REVOKED', 'DRAFT']).optional(),
  clientId: z.string().uuid('Client is required'),
  staffId: z.string().uuid().optional().nullable(),
  services: z.array(CarePlanServiceSchema).min(1, 'At least one service is required'),
}).strict();

export const CarePlanUpdateSchema = CarePlanCreateSchema.partial().extend({
  services: z.array(CarePlanServiceSchema).optional(),
}).strict().refine(patchHasAnyValue, {
  message: 'At least one field is required',
});

export const MedicationSchema = z.object({
  name: z.string().trim().min(1).max(255),
  dosage: z.string().trim().min(1).max(255),
  frequency: z.string().trim().min(1).max(255),
  route: z.string().trim().max(100).optional().nullable(),
  administrationType: z.string().trim().max(100).optional().nullable(),
  administrationTiming: z.string().trim().max(100).optional().nullable(),
  status: z.string().trim().max(50).optional().nullable(),
  startDate: z.string().datetime().or(z.date()).optional().nullable(),
  endDate: z.string().datetime().or(z.date()).optional().nullable(),
  prescriberName: z.string().trim().max(100).optional().nullable(),
  prescriberNPI: z.string().trim().max(20).optional().nullable(),
  pharmacyName: z.string().trim().max(100).optional().nullable(),
  pharmacyPhone: z.string().trim().max(20).optional().nullable(),
  refillCount: z.number().int().min(0).optional().nullable(),
  maxRefills: z.number().int().min(0).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
}).strict();

export const MedicationReconciliationSchema = z.object({
  action: z.enum(['compare', 'merge']).default('compare'),
  externalMedications: z.array(MedicationSchema).default([]),
}).strict();

export const ClientMedicalInfoPatchSchema = z.object({
  medications: z.array(MedicationSchema).optional(),
  medicalHistory: z.array(z.object({
    condition: z.string().trim().min(1).max(255),
    diagnosis: z.string().trim().max(255).optional().nullable(),
    date: z.string().datetime().or(z.date()).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  }).strict()).optional(),
}).strict().refine(patchHasAnyValue, {
  message: 'At least one field is required',
});

export const MedicationOrderSchema = z.object({
  clientId: z.string().uuid(),
  medicationId: z.string().uuid().optional().nullable(),
  prescriptionDate: z.string().datetime().or(z.date()).optional(),
  prescriberName: z.string().max(100).optional().nullable(),
  prescriberNPI: z.string().max(20).optional().nullable(),
  pharmacyName: z.string().max(100).optional().nullable(),
  pharmacyPhone: z.string().max(20).optional().nullable(),
  refillCount: z.number().min(0).optional(),
  maxRefills: z.number().min(0).optional().nullable(),
  status: z.string().optional()
});

export const SettingsUserCreateSchema = z.object({
  email: normalizedEmailSchema,
  password: passwordSchema,
  firstName: buildHumanNameSchema('First name'),
  lastName: buildHumanNameSchema('Last name'),
  role: z.enum(['STAFF', 'SUPERVISOR', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']),
  branchId: z.string().uuid().optional().nullable(),
}).strict();

export const SettingsUserUpdateSchema = z.object({
  email: normalizedEmailSchema.optional(),
  password: passwordSchema.optional(),
  firstName: buildHumanNameSchema('First name').optional(),
  lastName: buildHumanNameSchema('Last name').optional(),
  role: z.enum(['STAFF', 'SUPERVISOR', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  status: z.boolean().optional(),
  branchId: z.string().uuid().optional().nullable(),
}).strict().refine(patchHasAnyValue, {
  message: 'At least one field is required',
});

export const SettingsOrganizationPatchSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  email: normalizedEmailSchema.optional(),
  phone: optionalText(50),
  address: optionalText(255),
  city: optionalText(100),
  state: optionalText(100),
  zipCode: optionalText(20),
}).strict().refine(patchHasAnyValue, {
  message: 'At least one field is required',
});

export const SettingsServiceCreateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: optionalText(2000),
  duration: z.number().int().positive().optional().nullable(),
  baseRate: z.number().finite().nonnegative(),
  status: z.boolean().optional(),
}).strict();

export const SettingsServiceUpdateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  description: optionalText(2000),
  duration: z.number().int().positive().optional().nullable(),
  baseRate: z.number().finite().nonnegative().optional(),
  status: z.boolean().optional(),
}).strict().refine(patchHasAnyValue, {
  message: 'At least one field is required',
});

export const ProgressNotePatchSchema = z.object({
  visitId: z.string().uuid().optional().nullable(),
  type: z.enum(['SOAP', 'DAP', 'NARRATIVE', 'INCIDENT']).optional(),
  subjective: optionalText(2000),
  objective: optionalText(2000),
  assessment: optionalText(2000),
  plan: optionalText(2000),
  narrative: optionalText(10000),
}).strict().refine(patchHasAnyValue, {
  message: 'At least one field is required',
});

export const VitalSignPatchSchema = z.object({
  visitId: z.string().uuid().optional().nullable(),
  temperature: z.number().finite().optional().nullable(),
  temperatureUnit: z.string().trim().max(8).optional().nullable(),
  bloodPressureSystolic: z.number().finite().optional().nullable(),
  bloodPressureDiastolic: z.number().finite().optional().nullable(),
  heartRate: z.number().finite().optional().nullable(),
  respiratoryRate: z.number().finite().optional().nullable(),
  oxygenSaturation: z.number().finite().optional().nullable(),
  painLevel: z.number().finite().optional().nullable(),
  weight: z.number().finite().optional().nullable(),
  weightUnit: z.string().trim().max(12).optional().nullable(),
  height: z.number().finite().optional().nullable(),
  heightUnit: z.string().trim().max(12).optional().nullable(),
  bmi: z.number().finite().optional().nullable(),
  glucose: z.number().finite().optional().nullable(),
  glucoseUnit: z.string().trim().max(20).optional().nullable(),
  recordedAt: z.string().datetime().or(z.date()).optional(),
  notes: z.string().max(5000).optional().nullable(),
}).strict().refine(patchHasAnyValue, {
  message: 'At least one field is required',
});

export const VisitReportPatchSchema = z.object({
  type: z.enum(['VISIT_SUMMARY', 'PERIOD_SUMMARY']).optional(),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional().nullable(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  summary: optionalText(5000),
  servicesDelivered: z.any().optional().nullable(),
  clientCondition: optionalText(2000),
  notableEvents: optionalText(2000),
  recommendations: optionalText(2000),
  visitIds: z.array(z.string().uuid()).optional(),
}).strict().refine(patchHasAnyValue, {
  message: 'At least one field is required',
});
