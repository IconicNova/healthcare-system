import { z } from 'zod';

export const ClientSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email format").max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  dateOfBirth: z.string().datetime().or(z.date()).optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional().nullable(),
  ssn: z.string().refine(val => !val || /^(\d{3}-\d{2}-\d{4}|\d{9})$/.test(val), {
    message: "Invalid SSN format"
  }).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  zipCode: z.string().max(20).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCHARGED', 'DECEASED']).optional()
});

export const StaffSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email format").max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  role: z.string().max(100).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LEAVE_OF_ABSENCE', 'TERMINATED']).optional(),
  payType: z.enum(['HOURLY', 'SALARY', 'PER_VISIT']).optional().nullable(),
  hourlyRate: z.number().min(0).optional().nullable()
});

export const VisitSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  staffId: z.string().uuid("Invalid staff ID").optional().nullable(),
  serviceId: z.string().uuid("Invalid service ID").optional().nullable(),
  carePlanId: z.string().uuid("Invalid care plan ID").optional().nullable(),
  startTime: z.string().datetime().or(z.date()),
  endTime: z.string().datetime().or(z.date()),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'MISSED', 'CLOCKED_IN', 'OFFERED', 'VACANT']).optional(),
  title: z.string().max(255).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  branchId: z.string().uuid().optional().nullable()
});

export const InvoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price must be positive")
});

export const InvoiceSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  amount: z.number().min(0, "Amount must be positive").optional(), // Computed on backend usually
  dueDate: z.string().datetime().or(z.date()),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  notes: z.string().max(1000).optional().nullable(),
  invoiceItems: z.array(InvoiceItemSchema).min(1, "At least one invoice item is required").optional()
});
