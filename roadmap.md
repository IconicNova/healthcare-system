# HomeCare Pro — Comprehensive Codex Review Instructions

> **Purpose:** This document is a structural roadmap for the Codex agent. It provides a complete description of the homecare-pro project, a systematic review roadmap, and tailored review categories. Codex must use this roadmap to review the entire codebase without missing any file, module, or cross-cutting concern.

---

## 1. Project Description

### 1.1 What Is HomeCare Pro?

HomeCare Pro is a **HIPAA-compliant home care management platform** built to manage all aspects of a home-healthcare agency's operations: client management, staff scheduling, care plan creation, visit documentation, clinical charting (vitals, progress notes, medications), billing & invoicing, payroll & timesheets, insurance claims, reports & compliance dashboards, and role-based administrative settings.

It is a production-deployed **multi-tenant SaaS application** where each tenant is an `Organization` with one or more `Branch` locations.

### 1.2 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14.2.x |
| Language | JavaScript (JSX) with TypeScript config | ES2022 |
| Database | PostgreSQL | 16 |
| ORM | Prisma Client | 6.19.x |
| Auth | NextAuth v4 (JWT-based Credentials Provider) | 4.24.x |
| Validation | Zod | 4.3.x |
| Styling | TailwindCSS + Vanilla CSS (`globals.css` ≈183 KB) | 3.4.x |
| Charts | Recharts | 3.8.x |
| Calendar | FullCalendar (React) | 6.1.x |
| Icons | Lucide React | 1.7.x |
| Encryption | Node.js `crypto` (AES-256-GCM) | Built-in |
| Testing | Playwright (E2E) | 1.59.x |
| Deployment | Vercel + GitHub Actions CI | — |
| Dev DB | Docker Compose (postgres:16-alpine) | — |

### 1.3 Environment Variables

The application depends on four critical environment variables:

```
DATABASE_URL          — PostgreSQL connection string
NEXTAUTH_SECRET       — JWT signing secret
NEXTAUTH_URL          — Canonical URL for NextAuth callbacks
ENCRYPTION_KEY        — 32-byte hex key for AES-256-GCM SSN encryption
```

### 1.4 Multi-Tenant Data Model

Every data-bearing entity is scoped to an `organizationId`. Key tenancy chain:

```
Organization (root tenant)
 └── Branch (regional office)
      └── User (login identity, RBAC role)
           ├── Staff (1:1, employee profile with payType, skills, certifications, availability)
           └── Client (1:1 optional, patient profile with medical info, medications, documents)
```

### 1.5 RBAC Role Hierarchy

Roles are hierarchical: `SUPER_ADMIN (6) > ADMIN (5) > MANAGER (4) > SUPERVISOR (3) > STAFF (2) > CLIENT (1)`.

The `hasRoleAccess()` utility (in `src/lib/utils.js`) checks whether a user's numeric level ≥ any of the required roles. Some API routes enforce specific role checks (e.g. billing requires ADMIN/MANAGER/SUPERVISOR), while others only check session existence.

### 1.6 Prisma Data Model — Complete Entity Inventory

There are **27 models** and **12 enums** defined in `prisma/schema.prisma`:

**Enums:**
`UserRole`, `ClientStatus`, `StaffStatus`, `PayType`, `VisitStatus` (12 states), `FormStatus`, `InvoiceStatus`, `TimesheetStatus`, `MedAdministrationStatus`, `Frequency`, `InsuranceClaimStatus`, `ProgressNoteType`, `ReportPeriod`, `InteractionSeverity`

**Models:**
`Organization`, `Branch`, `User`, `Client`, `Staff`, `Service`, `CarePlan`, `CarePlanService`, `Visit`, `Invoice`, `InvoiceItem`, `InsuranceClaim`, `Timesheet`, `TimesheetEntry`, `Payment`, `EmergencyContact`, `Medication`, `MedAdministration`, `MedicalHistory`, `FormTemplate`, `ClientForm`, `StaffSkill`, `StaffCertification`, `StaffAvailability`, `VisitTask`, `VisitNote`, `ClientMedicalInfo`, `Document`, `ProgressNote`, `VitalSign`, `VisitReport`, `MedicationOrder`, `DrugInteraction`, `Notification`, `AuditLog`

**Key Relationships:**
- `Visit` is the central entity — linked to `Client`, `Staff`, `CarePlan`, `Service`, `Branch`, `Organization`, and has children: `VisitTask`, `VisitNote`, `InvoiceItem`, `ClientForm`, `MedAdministration`, `TimesheetEntry`, `ProgressNote`, `VitalSign`
- `Client` owns: `CarePlan` (1:m), `Visit` (1:m), `Medication` (1:m), `MedicalHistory` (1:m), `Document` (1:m), `ClientForm` (1:m), `EmergencyContact` (1:m), `ProgressNote` (1:m), `VitalSign` (1:m), `VisitReport` (1:m), `MedicationOrder` (1:m), `InsuranceClaim` (1:m), `Invoice` (1:m)
- `Staff` owns: `Visit` (1:m), `Timesheet` (1:m), `StaffSkill` (1:m), `StaffCertification` (1:m), `StaffAvailability` (1:m), `MedAdministration` (1:m)
- `Invoice` → `InvoiceItem` (1:m), `Payment` (1:m), `InsuranceClaim` (1:m)

### 1.7 Database Indexes

The schema defines explicit composite indexes on:
- `client(organizationId, status)`, `client(organizationId, branchId)`
- `staff(organizationId, status)`, `staff(organizationId, branchId)`
- `visit(organizationId, startTime)`, `visit(staffId, startTime, status)`, `visit(organizationId, status)`, `visit(organizationId, clientId)`, `visit(organizationId, staffId)`, `visit(clientId, status)`
- `invoice(organizationId, status)`, `invoice(organizationId, clientId)`
- `timesheet(organizationId, staffId)`, `timesheet(organizationId, status)`
- `progressNote(clientId, createdAt)`, `progressNote(visitId)`
- `vitalSign(clientId, recordedAt)`, `vitalSign(visitId)`
- `visitReport(clientId, startDate, endDate)`
- `medicationOrder(clientId, status)`
- `document(clientId)`

---

## 2. Complete Directory & File Map

### 2.1 Source Structure

```
src/
├── app/
│   ├── layout.js                          # Root layout (Inter font, ClientProviders)
│   ├── page.js                            # Home redirect
│   ├── not-found.js                       # 404 page
│   ├── globals.css                        # ~183 KB master stylesheet
│   │
│   ├── (auth)/
│   │   ├── layout.js                      # Auth layout wrapper
│   │   └── login/page.js                  # Login page with rate-limited auth
│   │
│   ├── (dashboard)/
│   │   ├── layout.js                      # Dashboard layout (Sidebar + TopBar + ErrorBoundary)
│   │   ├── error.js                       # Dashboard error boundary page
│   │   ├── loading.js                     # Dashboard loading spinner
│   │   ├── dashboard/page.js              # Main dashboard (KPIs, charts, alerts)
│   │   ├── billing/page.js                # Billing page (invoices, claims, payments)
│   │   ├── care-delivery/
│   │   │   ├── page.js                    # Care delivery (tasks, notes, vitals, reports)
│   │   │   ├── forms/[formId]/page.js     # Form charting page
│   │   │   └── medications/page.js        # Medication management page
│   │   ├── care-plans/
│   │   │   ├── page.js                    # Care plans list
│   │   │   ├── [id]/page.js              # Care plan detail view
│   │   │   └── [id]/edit/page.js         # Care plan edit form
│   │   ├── clients/
│   │   │   ├── page.js                    # Client list
│   │   │   ├── new/page.js               # New client form
│   │   │   ├── [id]/page.js              # Client profile (tabbed: overview, medical, visits, care plans, forms, documents)
│   │   │   └── [id]/edit/page.js         # Client edit form
│   │   ├── notifications/page.js          # Notification center
│   │   ├── payroll/page.js                # Payroll (timesheets, payslips, pay summary)
│   │   ├── reports/page.js                # Reports dashboard
│   │   ├── scheduling/page.js             # Calendar scheduling (FullCalendar)
│   │   ├── settings/page.js               # Settings (org, services, users, billing, payroll, scheduling, notifications)
│   │   └── staff/
│   │       ├── page.js                    # Staff list
│   │       ├── [id]/page.js              # Staff profile (tabbed)
│   │       └── [id]/edit/page.js         # Staff edit form
│   │
│   └── api/                               # 18 API domain directories
│       ├── auth/[...nextauth]/route.js    # NextAuth + rate-limited POST
│       ├── billing/
│       │   ├── insurance-claims/route.js           # GET/POST claims
│       │   ├── insurance-claims/[id]/route.js      # GET/PATCH/DELETE claim
│       │   ├── invoices/route.js                   # GET/POST invoices
│       │   ├── invoices/generate-batch/route.js    # POST batch invoice generation
│       │   ├── invoices/uninvoiced-visits/route.js  # GET uninvoiced visits
│       │   ├── invoices/[id]/route.js              # GET/PATCH/DELETE invoice
│       │   ├── invoices/[id]/send/route.js         # POST send invoice
│       │   ├── payments/route.js                   # GET/POST payments
│       │   └── stats/route.js                      # GET billing statistics
│       ├── branches/route.js              # GET branches
│       ├── care-plans/
│       │   ├── route.js                   # GET/POST care plans
│       │   ├── [id]/route.js             # GET/PATCH/DELETE care plan
│       │   └── [id]/generate-visits/route.js  # POST generate visits from care plan
│       ├── clients/
│       │   ├── route.js                   # GET/POST clients (SSN encryption on create)
│       │   └── [id]/
│       │       ├── route.js              # GET/PATCH/DELETE client (SSN masking on read)
│       │       ├── avatar/route.js       # PATCH avatar upload
│       │       ├── documents/route.js    # GET/POST documents
│       │       ├── forms/route.js        # GET/POST client forms
│       │       ├── medical/route.js      # GET/PATCH medical info
│       │       ├── medications/route.js  # GET/POST medications
│       │       ├── medications/reconcile/route.js  # POST medication reconciliation
│       │       ├── progress-notes/route.js  # GET/POST progress notes
│       │       ├── reports/route.js      # GET client reports
│       │       ├── visits/route.js       # GET client visits
│       │       └── vitals/route.js       # GET/POST vital signs
│       ├── dashboard/
│       │   ├── alerts/route.js           # GET alerts
│       │   ├── recent-invoices/route.js  # GET recent invoices
│       │   ├── revenue-chart/route.js    # GET revenue data
│       │   ├── stats/route.js            # GET dashboard KPIs
│       │   ├── upcoming-shifts/route.js  # GET upcoming shifts
│       │   └── visit-chart/route.js      # GET visit statistics
│       ├── forms/
│       │   ├── templates/route.js        # GET form templates
│       │   └── [id]/route.js            # GET/PATCH/DELETE form
│       ├── medications/
│       │   ├── check-interactions/route.js  # POST drug interaction check
│       │   └── [id]/
│       │       ├── administer/route.js   # POST medication administration
│       │       └── history/route.js      # GET administration history
│       ├── notifications/
│       │   ├── route.js                  # GET notifications (paginated)
│       │   ├── mark-all-read/route.js    # PATCH mark all read
│       │   ├── unread-count/route.js     # GET unread count
│       │   └── [id]/
│       │       ├── route.js             # GET/DELETE notification
│       │       └── read/route.js        # PATCH mark as read
│       ├── payroll/
│       │   ├── pay-summary/route.js      # GET pay summary
│       │   ├── payslips/route.js         # GET/POST payslips
│       │   ├── stats/route.js            # GET payroll statistics
│       │   ├── timesheet-entries/[id]/route.js  # PATCH/DELETE entry
│       │   └── timesheets/
│       │       ├── route.js             # GET/POST timesheets
│       │       ├── generate/route.js    # POST auto-generate timesheets
│       │       ├── [id]/route.js        # GET/PATCH/DELETE timesheet
│       │       └── [id]/entries/route.js # GET/POST entries
│       ├── progress-notes/[id]/route.js  # GET/PATCH/DELETE progress note
│       ├── reports/
│       │   ├── client-history/[clientId]/route.js  # GET client history report
│       │   ├── compliance/route.js       # GET compliance report
│       │   ├── financial/route.js        # GET financial report
│       │   ├── staff-performance/route.js # GET staff performance
│       │   ├── visit-logs/route.js       # GET visit logs
│       │   ├── [id]/route.js            # GET/PATCH/DELETE report
│       │   └── [id]/generate/route.js   # POST generate report
│       ├── services/route.js             # GET services
│       ├── settings/
│       │   ├── config/route.js           # GET/PATCH global config
│       │   ├── organization/route.js     # GET/PATCH org settings
│       │   ├── services/route.js         # GET/POST services
│       │   ├── services/[id]/route.js   # PATCH/DELETE service
│       │   ├── users/route.js           # GET users
│       │   └── users/[id]/route.js      # PATCH/DELETE user
│       ├── staff/
│       │   ├── route.js                  # GET/POST staff (creates User + Staff in transaction)
│       │   └── [id]/
│       │       ├── route.js             # GET/PATCH/DELETE staff
│       │       ├── availability/route.js # GET/PUT availability grid
│       │       ├── avatar/route.js      # PATCH avatar
│       │       ├── certifications/route.js       # GET/POST certifications
│       │       ├── certifications/[certId]/route.js  # PATCH/DELETE certification
│       │       ├── skills/route.js      # GET/POST skills
│       │       ├── skills/[skillId]/route.js  # PATCH/DELETE skill
│       │       ├── timesheets/route.js  # GET staff timesheets
│       │       └── visits/route.js      # GET staff visits
│       ├── visit-tasks/[id]/route.js     # PATCH/DELETE visit task
│       ├── visits/
│       │   ├── route.js                  # GET/POST visits (with recurrence + conflict detection)
│       │   ├── conflicts/route.js        # GET conflict checking
│       │   ├── status-counts/route.js    # GET status summary
│       │   └── [id]/
│       │       ├── route.js             # GET/PATCH/DELETE visit
│       │       ├── forms/route.js       # GET/POST visit forms
│       │       ├── notes/route.js       # GET/POST visit notes
│       │       └── tasks/route.js       # GET/POST visit tasks
│       └── vitals/[id]/
│           ├── route.js                 # GET/PATCH/DELETE vital sign
│           └── trends/route.js          # GET trends data
```

### 2.2 Components Hierarchy

```
src/components/
├── ErrorBoundary.jsx          # Class-based React error boundary
├── providers.js               # SessionProvider wrapper
│
├── ui/                        # 15 reusable primitives
│   ├── Button.jsx, Card.jsx, DataTable.jsx, EmptyState.jsx
│   ├── ImageEditorModal.jsx, Input.jsx, KPICard.jsx, Modal.jsx
│   ├── Pagination.jsx, SearchInput.jsx, Select.jsx
│   ├── StatusBadge.jsx, Tabs.jsx, Toast.jsx, useToast.js
│
├── layout/                    # 4 layout components
│   ├── Sidebar.jsx, TopBar.jsx, Breadcrumb.jsx, LoadingSpinner.jsx
│
├── billing/                   # 12 components
│   ├── BillingSummary, GenerateBatchModal, ImportVisitsModal
│   ├── InsuranceClaimDetail, InsuranceClaimForm, InsuranceClaimList
│   ├── InvoiceDetail, InvoiceForm, InvoiceLineItems, InvoiceList
│   ├── PaymentForm, PaymentList
│
├── care-delivery/             # 16 components (largest domain)
│   ├── AddProgressNoteModal, CareDeliveryLayout
│   ├── DrugInteractionAlert, EditVisitDialog
│   ├── EditVisitNotesTab, EditVisitTasksTab
│   ├── FormFieldRenderer, MedicationReconciliation
│   ├── ProgressNotesTab, TasksView, VisitNotesTab
│   ├── VisitReportBuilder, VisitReportsTab
│   ├── VitalsChart, VitalsEntryForm, VitalsTab
│
├── care-plans/                # 1 component
│   └── CarePlanForm
│
├── clients/                   # 9 components
│   ├── ClientCarePlansTab, ClientDocumentsTab, ClientForm
│   ├── ClientFormsTab, ClientList, ClientMedicalTab
│   ├── ClientOverviewTab, ClientProfile, ClientVisitsTab
│
├── dashboard/                 # 7 components
│   ├── AlertsPanel, EVVWidget, MetricsGrid
│   ├── RecentInvoices, RevenueChart, UpcomingShifts, VisitChart
│
├── notifications/             # 3 components
│   ├── NotificationDropdown, NotificationItem, NotificationList
│
├── payroll/                   # 9 components
│   ├── ExportAccountingModal, GenerateTimesheetModal
│   ├── PayrollSummary, PayslipDetail, PayslipList
│   ├── PaySummaryTable, TimesheetDetail, TimesheetEntryForm, TimesheetList
│
├── reports/                   # 6 components
│   ├── ClientHistory, ComplianceDashboard, ExportButton
│   ├── FinancialReport, StaffPerformance, VisitLogs
│
├── scheduling/                # 4 components
│   ├── SchedulingCalendar, VisitDetailPopup, VisitEditForm, VisitForm
│
├── settings/                  # 7 components
│   ├── BillingSettings, NotificationSettings, OrganizationSettings
│   ├── PayrollSettings, SchedulingRules, ServicesConfiguration, UsersAndRoles
│
└── staff/                     # 8 components
    ├── AvailabilityGrid, SkillsCertsTab, StaffForm
    ├── StaffList, StaffOverviewTab, StaffProfile
    ├── StaffScheduleTab, StaffTimesheetsTab
```

### 2.3 Library Layer (`src/lib/`)

| File | Purpose | Size |
|------|---------|------|
| `auth.js` | NextAuth config: Credentials provider, JWT callbacks, 8-hour session | 2.8 KB |
| `encryption.js` | AES-256-GCM encrypt/decrypt/maskSSN for PHI | 2.4 KB |
| `validations.js` | Zod schemas: Client, Staff, Visit, Invoice, ProgressNote, VitalSign, VisitReport, MedicationOrder | 6.9 KB |
| `rate-limit.js` | In-memory rate limiter (Map-based, 5-min cleanup) | 1.5 KB |
| `api-response.js` | Standardized API response helpers (success, error, unauthorized, forbidden, notFound, serverError) | 1.1 KB |
| `utils.js` | cn(), formatCurrency(), formatDate(), formatTime(), formatDateTime(), getInitials(), getStatusColor(), calculateAge(), truncate(), formatPhone(), getRoleDisplayName(), hasRoleAccess() | 4.2 KB |
| `prisma.js` | Prisma Client singleton (global caching for dev) | 253 B |

### 2.4 Infrastructure Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema (918 lines, 27 models, 12 enums) |
| `prisma/seed.js` | Database seeder (1,453 lines — users, staff, clients, visits, invoices, etc.) |
| `prisma/seed-drug-interactions.js` | Drug interaction reference data seeder |
| `prisma/addDocuments.js` | Document migration helper |
| `next.config.mjs` | Security headers (X-Frame-Options, HSTS, CSP, Permissions-Policy) |
| `vercel.json` | Vercel build: `prisma generate && prisma db push && next build` |
| `docker-compose.yml` | Local PostgreSQL 16 (port 5433) |
| `.github/workflows/ci.yml` | CI: checkout → npm ci → prisma validate → prisma generate → lint → build |
| `tests/create-care-plan.spec.js` | Playwright E2E test for care plan creation |

### 2.5 Knowledge Graph Summary (from graphify-out)

- **412 nodes, 321 edges, 152 communities detected**
- **God Nodes** (most connected): `GET()` (64 edges), `POST()` (35 edges), `PATCH()` (22 edges), `DELETE()` (18 edges)
- **High-cohesion clusters**: Encryption (cohesion 0.7), Medication Reconciliation (0.6), Drug Interactions (1.0)
- **Low-cohesion clusters**: API GET routes (0.04), API mutation routes (0.1) — these are overly broad communities
- **Surprising cross-module calls**: Visit tasks route calls medication reconciliation, report generation, and employee ID generation — all from different domains

---

## 3. Comprehensive Review Roadmap

Codex must follow this ordered roadmap to systematically review every layer of the codebase. Each phase includes the exact file paths to inspect.

### Phase 1: Foundation Layer

Review core infrastructure that every module depends on.

1. **Prisma Schema** — `prisma/schema.prisma`
2. **Prisma Client Singleton** — `src/lib/prisma.js`
3. **Authentication Config** — `src/lib/auth.js`
4. **Auth Route Handler** — `src/app/api/auth/[...nextauth]/route.js`
5. **Encryption Module** — `src/lib/encryption.js`
6. **Validation Schemas** — `src/lib/validations.js`
7. **API Response Helpers** — `src/lib/api-response.js`
8. **Rate Limiter** — `src/lib/rate-limit.js`
9. **Utility Functions** — `src/lib/utils.js`
10. **Next.js Config (Security Headers)** — `next.config.mjs`

### Phase 2: API Routes — Client & Staff Management

11. **Clients CRUD** — `src/app/api/clients/route.js`, `src/app/api/clients/[id]/route.js`
12. **Client Sub-Resources** — `src/app/api/clients/[id]/avatar/`, `documents/`, `forms/`, `medical/`, `medications/`, `medications/reconcile/`, `progress-notes/`, `reports/`, `visits/`, `vitals/`
13. **Staff CRUD** — `src/app/api/staff/route.js`, `src/app/api/staff/[id]/route.js`
14. **Staff Sub-Resources** — `src/app/api/staff/[id]/availability/`, `avatar/`, `certifications/`, `certifications/[certId]/`, `skills/`, `skills/[skillId]/`, `timesheets/`, `visits/`

### Phase 3: API Routes — Scheduling & Care Delivery

15. **Visits CRUD** — `src/app/api/visits/route.js`, `src/app/api/visits/[id]/route.js`
16. **Visit Sub-Resources** — `visits/conflicts/`, `visits/status-counts/`, `visits/[id]/forms/`, `visits/[id]/notes/`, `visits/[id]/tasks/`
17. **Visit Tasks** — `src/app/api/visit-tasks/[id]/route.js`
18. **Care Plans** — `src/app/api/care-plans/route.js`, `care-plans/[id]/route.js`, `care-plans/[id]/generate-visits/`
19. **Medications** — `src/app/api/medications/check-interactions/route.js`, `medications/[id]/administer/`, `medications/[id]/history/`

### Phase 4: API Routes — Billing & Payroll

20. **Invoices** — `src/app/api/billing/invoices/route.js`, `invoices/[id]/route.js`, `invoices/[id]/send/`, `invoices/generate-batch/`, `invoices/uninvoiced-visits/`
21. **Payments** — `src/app/api/billing/payments/route.js`
22. **Insurance Claims** — `src/app/api/billing/insurance-claims/route.js`, `insurance-claims/[id]/route.js`
23. **Billing Stats** — `src/app/api/billing/stats/route.js`
24. **Timesheets** — `src/app/api/payroll/timesheets/route.js`, `timesheets/generate/`, `timesheets/[id]/route.js`, `timesheets/[id]/entries/`
25. **Timesheet Entries** — `src/app/api/payroll/timesheet-entries/[id]/route.js`
26. **Payslips** — `src/app/api/payroll/payslips/route.js`
27. **Pay Summary & Stats** — `src/app/api/payroll/pay-summary/route.js`, `payroll/stats/route.js`

### Phase 5: API Routes — Reports, Notifications, Settings, Misc

28. **Reports** — `src/app/api/reports/client-history/[clientId]/`, `compliance/`, `financial/`, `staff-performance/`, `visit-logs/`, `[id]/route.js`, `[id]/generate/`
29. **Progress Notes** — `src/app/api/progress-notes/[id]/route.js`
30. **Vitals** — `src/app/api/vitals/[id]/route.js`, `vitals/[id]/trends/`
31. **Notifications** — `src/app/api/notifications/route.js`, `mark-all-read/`, `unread-count/`, `[id]/route.js`, `[id]/read/`
32. **Dashboard Stats** — `src/app/api/dashboard/alerts/`, `recent-invoices/`, `revenue-chart/`, `stats/`, `upcoming-shifts/`, `visit-chart/`
33. **Settings** — `src/app/api/settings/config/`, `organization/`, `services/route.js`, `services/[id]/`, `users/route.js`, `users/[id]/`
34. **Services** — `src/app/api/services/route.js`
35. **Branches** — `src/app/api/branches/route.js`

### Phase 6: Frontend Pages

36. **Root & Auth** — `src/app/layout.js`, `src/app/page.js`, `src/app/not-found.js`, `src/app/(auth)/layout.js`, `src/app/(auth)/login/page.js`
37. **Dashboard Layout** — `src/app/(dashboard)/layout.js`, `error.js`, `loading.js`
38. **Dashboard Page** — `src/app/(dashboard)/dashboard/page.js`
39. **Client Pages** — `clients/page.js`, `clients/new/page.js`, `clients/[id]/page.js`, `clients/[id]/edit/page.js`
40. **Staff Pages** — `staff/page.js`, `staff/[id]/page.js`, `staff/[id]/edit/page.js`
41. **Scheduling Page** — `scheduling/page.js`
42. **Care Plans Pages** — `care-plans/page.js`, `care-plans/[id]/page.js`, `care-plans/[id]/edit/page.js`
43. **Care Delivery Pages** — `care-delivery/page.js`, `care-delivery/forms/[formId]/page.js`, `care-delivery/medications/page.js`
44. **Billing & Payroll Pages** — `billing/page.js`, `payroll/page.js`
45. **Reports, Notifications, Settings** — `reports/page.js`, `notifications/page.js`, `settings/page.js`

### Phase 7: Frontend Components

46. **UI Primitives** — All 15 files in `src/components/ui/`
47. **Layout Components** — `Sidebar.jsx`, `TopBar.jsx`, `Breadcrumb.jsx`, `LoadingSpinner.jsx`
48. **Billing Components** — All 12 files in `src/components/billing/`
49. **Care Delivery Components** — All 16 files in `src/components/care-delivery/`
50. **Client Components** — All 9 files in `src/components/clients/`
51. **Staff Components** — All 8 files in `src/components/staff/`
52. **Scheduling Components** — All 4 files in `src/components/scheduling/`
53. **Payroll Components** — All 9 files in `src/components/payroll/`
54. **Report Components** — All 6 files in `src/components/reports/`
55. **Dashboard Components** — All 7 files in `src/components/dashboard/`
56. **Notification Components** — All 3 files in `src/components/notifications/`
57. **Settings Components** — All 7 files in `src/components/settings/`

### Phase 8: Data & Testing Layer

58. **Seed Files** — `prisma/seed.js`, `prisma/seed-drug-interactions.js`, `prisma/addDocuments.js`
59. **E2E Tests** — `tests/create-care-plan.spec.js`
60. **CI/CD** — `.github/workflows/ci.yml`
61. **Deployment** — `vercel.json`, `docker-compose.yml`
62. **Config Files** — `package.json`, `tsconfig.json`, `.eslintrc.json`, `tailwind.config.js`, `postcss.config.js`
63. **Stylesheet** — `src/app/globals.css`

---

