# Homecare Pro - Architectural Review

## Executive Summary

This document presents a comprehensive architectural review of the Homecare Pro codebase, focusing on API route handlers, UI components, database schema, and shared utilities. The review identifies **2 Critical**, **4 High**, **6 Medium**, and **8 Low** severity findings with actionable recommendations.

---

## 1. Component Boundaries & Separation of Concerns

### 1.1 Finding: Leaky Abstractions in API Routes (CRITICAL)
**Severity:** Critical
**Architectural Impact:** High
**Location:** `src/app/api/*` route handlers

#### Issue
API routes directly import and instantiate PrismaClient, bypassing any potential abstraction layer. Business logic is embedded within route handlers rather than in a dedicated service layer.

**Example from `src/app/api/visits/route.js`:**
```javascript
// Direct Prisma access with business logic embedded
export async function POST(request) {
  const session = await getServerSession(authOptions);
  const body = await request.json();

  // Business logic (conflict detection) embedded in route handler
  const staffConflicts = await prisma.visit.findMany({
    where: {
      staffId,
      organizationId: session.user.organizationId,
      status: { not: 'CANCELLED' },
      OR: [{ startTime: { lte: new Date(endTime) }, endTime: { gte: new Date(startTime) } }]
    }
  });

  // Create visit directly
  const visit = await prisma.visit.create({ data: {...} });
}
```

#### Recommendation
Implement a **Repository Pattern** with **Domain Services**:

```typescript
// src/lib/repositories/visit-repository.ts
export class VisitRepository {
  constructor(private prisma: PrismaClient) {}

  async findConflicts(staffId: string, startTime: Date, endTime: Date): Promise<Visit[]> {
    return this.prisma.visit.findMany({
      where: {
        staffId,
        status: { not: 'CANCELLED' },
        startTime: { lte: endTime },
        endTime: { gte: startTime },
      },
    });
  }
}

// src/lib/services/visit-service.ts
export class VisitService {
  constructor(
    private visitRepo: VisitRepository,
    private prisma: PrismaClient
  ) {}

  async createVisit(data: CreateVisitDTO, userId: string) {
    // Conflict checking logic
    const conflicts = await this.visitRepo.findConflicts(
      data.staffId,
      data.startTime,
      data.endTime
    );

    if (conflicts.length > 0) {
      throw new ConflictError('Time slot conflict detected', conflicts);
    }

    return this.prisma.visit.create({ data });
  }
}

// src/app/api/visits/route.js
export async function POST(request) {
  const service = new VisitService(new VisitRepository(prisma), prisma);
  const result = await service.createVisit(body, session.user.id);
  return NextResponse.json(result, { status: 201 });
}
```

---

### 1.2 Finding: Violation of Single Responsibility in ClientForm (HIGH)
**Severity:** High
**Architectural Impact:** Medium
**Location:** `src/components/clients/ClientForm.jsx`

#### Issue
The `ClientForm` component handles multiple responsibilities:
- Form state management
- File upload logic (avatar handling)
- Image editing workflow
- API communication
- Validation logic
- Navigation logic

**Architectural Violation:** 800+ line component with 15+ useState hooks handling unrelated concerns.

#### Recommendation
Apply **Compound Component Pattern** and **Custom Hooks**:

```javascript
// src/components/clients/ClientForm.jsx
export default function ClientForm({ client, onSuccess, onCancel }) {
  const { formData, errors, handleSubmit } = useClientFormState(client);
  const { avatarPreview, handleAvatarSelect } = useAvatarUploader(client?.id);

  return (
    <Form onSubmit={handleSubmit}>
      <AvatarUploader
        preview={avatarPreview}
        onSelect={handleAvatarSelect}
      />
      <PersonalInfoFields formData={formData} />
      <AddressFields formData={formData} />
      <EmergencyContacts
        contacts={formData.emergencyContacts}
        onChange={(contacts) => setFormData({...formData, emergencyContacts: contacts})}
      />
    </Form>
  );
}

// Custom hook for form state
export function useClientFormState(client) {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});

  const validate = () => {
    // Validation logic extracted
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    // API handling
  };

  return { formData, errors, handleSubmit, setFormData };
}
```

---

### 1.3 Finding: Tight Coupling Between UI and API Contracts (MEDIUM)
**Severity:** Medium
**Architectural Impact:** Medium
**Location:** Throughout `src/components/` and `src/app/api/`

#### Issue
Frontend components directly depend on exact API response shapes. No data transformation layer exists between API responses and UI consumption.

**Example:** Dashboard stats endpoint returns specific shape that `KPICard` components assume:
```javascript
// src/app/api/dashboard/stats/route.js - returns:
{
  totalClients: { value: number, change: string, changeType: string }
}

// src/components/dashboards/KPICard.jsx - assumes this exact structure
{kpi.value} <span>{kpi.change}</span>
```

#### Recommendation
Implement **DTOs (Data Transfer Objects)** and **View Models**:

```typescript
// src/lib/dtos/dashboard.ts
export interface DashboardStatsDTO {
  totalClients: ClientStats;
  activeStaff: StaffStats;
}

export interface ClientStats {
  count: number;
  percentChange: number;
  trend: 'up' | 'down' | 'neutral';
}

// src/lib/transformers.ts
export const transformDashboardStats = (raw: any): DashboardStatsDTO => ({
  totalClients: {
    count: raw.totalClients.value,
    percentChange: parseFloat(raw.totalClients.change),
    trend: raw.totalClients.changeType === 'positive' ? 'up' : 'down',
  },
  // ...
});
```

---

## 2. Dependency Management

### 2.1 Finding: Circular Dependency Risk in Auth (HIGH)
**Severity:** High
**Architectural Impact:** High
**Location:** `src/lib/auth.js`, `src/lib/prisma.js`

#### Issue
While not currently circular, `auth.js` imports `prisma`, and if `prisma.js` were to import any auth-related utilities (for middleware checks), a circular dependency would occur. The auth module directly instantiates database operations without abstraction.

#### Recommendation
Introduce **Dependency Injection** pattern:

```javascript
// src/lib/auth.js
const NextAuthConfig = {
  providers: [
    CredentialsProvider({
      async authorize(credentials, ctx) {
        const userRepository = ctx.get('userRepository');
        const user = await userRepository.findByEmail(credentials.email);
        // ...
      }
    })
  ]
};

// src/lib/auth.config.js (middleware)
export const authConfig = {
  callbacks: {
    async jwt({ token, user, trigger }) {
      // No direct database access here
    }
  }
};
```

---

### 2.2 Finding: Missing Dependency Inversion in Service Creation (MEDIUM)
**Severity:** Medium
**Architectural Impact:** Medium

#### Issue
Services (visits, invoices, timesheets) are created directly within route handlers without a factory or dependency injection container, making testing difficult.

#### Recommendation
Use a **Service Locator** or **Factory Pattern**:

```javascript
// src/lib/services/factory.js
export const createServices = (prisma) => ({
  visits: new VisitService(prisma),
  invoices: new InvoiceService(prisma),
  timesheets: new TimesheetService(prisma),
});

// src/app/api/visits/route.js
const services = createServices(prisma);
export async function POST(request) {
  const result = await services.visits.create(request.body);
}
```

---

## 3. API Design

### 3.1 Finding: Inconsistent Error Response Contracts (CRITICAL)
**Severity:** Critical
**Architectural Impact:** High
**Location:** All API routes

#### Issue
Error responses are inconsistent across endpoints:
- Some return `{ error: 'string' }`
- Some return `{ error: 'string', conflicts: [] }` (visits POST)
- Some return `{ message: 'string' }` (success cases)
- Status codes vary (201 vs 200 for creation)

**Examples:**
```javascript
// Inconsistent patterns across codebase:
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
return NextResponse.json({ error: 'Time slot conflict detected', conflicts }, { status: 409 });
return NextResponse.json({ message: 'Client deleted successfully' }); // 200
return NextResponse.json(invoice, { status: 201 }); // 201 with body
```

#### Recommendation
Standardize on **RFC 7807 Problem Details** structure:

```javascript
// src/lib/api-error.js
export class ApiError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const formatErrorResponse = (error) => ({
  status: error.statusCode || 500,
  error: {
    code: error.code || 'INTERNAL_ERROR',
    message: error.message,
    ...(error.details && { details: error.details }),
    path: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  },
});

// Usage in route:
export async function POST(request) {
  try {
    if (!clientId) {
      throw new ApiError('Client ID is required', 400, 'VALIDATION_ERROR');
    }
    // ...
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(formatErrorResponse(error), { status: error.statusCode });
    }
    throw error;
  }
}
```

---

### 3.2 Finding: Missing Pagination Consistency (MEDIUM)
**Severity:** Medium
**Architectural Impact:** Low

#### Issue
Pagination implementation varies:
- Some endpoints use `page`/`limit` (invoices, timesheets)
- Some use hardcoded `take: 10` (dashboard recent items)
- Some return `{ items, pagination }` wrapper, others just arrays

#### Recommendation
Standardize pagination interface:

```typescript
// src/lib/pagination.ts
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const parsePagination = (req: Request): PaginationParams => {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '10')));
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

export const formatPaginatedResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasMore: page < Math.ceil(total / limit),
  },
});
```

---

### 3.3 Finding: Resource Nesting Inconsistency (MEDIUM)
**Severity:** Medium
**Architectural Impact:** Low

#### Issue
REST resource hierarchy is inconsistent:
- `/api/clients/[id]/visits` (nested)
- `/api/visits` (top-level with clientId filter)
- `/api/payroll/timesheet-entries/[id]` (nested under payroll, not timesheets)

#### Recommendation
Adopt **RESTful resource hierarchy** with filtering for polymorphic queries:

```javascript
// Consistent patterns:
GET    /api/clients/{id}/visits      // Visits for specific client
GET    /api/visits?clientId={id}     // Filtered visits list
PATCH  /api/visits/{id}              // Update visit

// Instead of:
GET    /api/payroll/timesheet-entries/{id}  // Inconsistent
// Use:
GET    /api/timesheets/{id}/entries/{entryId}
```

---

## 4. Data Model

### 4.1 Finding: N+1 Query Risk in Dashboard Stats (HIGH)
**Severity:** High
**Architectural Impact:** Medium
**Location:** `src/app/api/dashboard/stats/route.js`, `src/app/api/dashboard/recent-invoices/route.js`

#### Issue
Multiple sequential queries for dashboard metrics without connection pooling optimization or query batching. The stats endpoint performs 10+ separate database queries.

#### Recommendation
Use **Prisma Transaction with Selective Includes** and **Database Views** for aggregations:

```sql
-- Create database view for frequent aggregations
CREATE VIEW dashboard_metrics AS
SELECT
  organization_id,
  COUNT(DISTINCT client_id) as active_clients,
  COUNT(DISTINCT staff_id) as active_staff,
  SUM(CASE WHEN status IN ('PAID','SENT') THEN amount ELSE 0 END) as revenue
FROM ...
GROUP BY organization_id;
```

```javascript
// src/lib/repositories/metrics-repository.js
async function getDashboardMetrics(orgId) {
  return Promise.all([
    // Parallel queries where possible
    prisma.client.count({ where: { orgId, status: 'ACTIVE' } }),
    prisma.staff.count({ where: { orgId, status: 'ACTIVE' } }),
    prisma.visit.count({ where: { orgId, dateRange } }),
    prisma.invoice.aggregate({
      where: { orgId, status: { in: ['PAID'] } },
      _sum: { amount: true }
    }),
  ]);
}
```

---

### 4.2 Finding: Missing Database Indexes for Composite Queries (MEDIUM)
**Severity:** Medium
**Architectural Impact:** Medium
**Location:** `prisma/schema.prisma`

#### Issue
While some indexes exist, composite queries used in filtering (e.g., `WHERE organizationId = X AND status = Y AND startTime BETWEEN A AND B`) lack composite indexes.

**Current schema:**
```prisma
@@index([organizationId, startTime])
@@index([organizationId, status])
```

**Missing:** Composite index for date-range queries with status filtering.

#### Recommendation
Add **composite indexes** for common query patterns:

```prisma
model Visit {
  // Add composite index for date-range + status queries
  @@index([organizationId, status, startTime])
  @@index([clientId, startTime, status])  // For client portal queries

  // Add partial index for active visits (if using PostgreSQL)
  @@index([[status] Map("visit_active_index")], where: "status IN ('SCHEDULED', 'IN_PROGRESS', 'CLOCKED_IN')")
}
```

---

### 4.3 Finding: Cascade Delete Risks (MEDIUM)
**Severity:** Medium
**Architectural Impact:** High
**Location:** `prisma/schema.prisma`

#### Issue
Aggressive cascade deletes may lead to data loss:
```prisma
// Organization delete cascades to EVERYTHING
organization Organization @relation(..., onDelete: Cascade)
```

No soft-delete mechanism exists for critical entities (Client, Staff, Visit).

#### Recommendation
Implement **Soft Deletes** and **Restrictive Constraints**:

```prisma
model Client {
  deletedAt DateTime?

  // Restrict deletion if visits exist with billing records
  visits Visit[] @relation(onDelete: Restrict)

  // Use soft delete instead
  @@map("client")
}

// Use partial indexes for soft-delete queries
@@index([organizationId, deletedAt], map: "client_active_idx")
```

---

## 5. Design Patterns

### 5.1 Finding: Missing Domain-Driven Design Boundaries (HIGH)
**Severity:** High
**Architectural Impact:** High

#### Issue
The codebase uses **Anemic Domain Model** pattern where entities are essentially data containers without behavior. All logic resides in route handlers (god controllers) rather than in domain objects.

**Example:**
```javascript
// Anemic domain - Visit has no behavior
model Visit {
  id String @id
  startTime DateTime
  status VisitStatus
  // ...fields only, no methods
}

// Logic scattered in route handlers
if (new Date(endTime) <= new Date(startTime)) {
  return error;
}
```

#### Recommendation
Introduce **Rich Domain Model** with domain events:

```typescript
// src/domain/visit/visit.ts
export class Visit {
  constructor(
    public id: string,
    public clientId: string,
    public staffId: string | null,
    public startTime: Date,
    public endTime: Date,
    private status: VisitStatus = 'SCHEDULED'
  ) {}

  clockIn(): void {
    if (!this.canClockIn()) {
      throw new DomainError('Cannot clock in for visit in current status');
    }
    this.status = 'CLOCKED_IN';
    this.actualStart = new Date();
  }

  complete(actualEnd: Date): void {
    if (this.status !== 'CLOCKED_IN' && this.status !== 'IN_PROGRESS') {
      throw new DomainError('Cannot complete visit');
    }
    this.status = 'COMPLETED';
    this.actualEnd = actualEnd;
  }

  private canClockIn(): boolean {
    return ['SCHEDULED', 'VACANT', 'OFFERED'].includes(this.status);
  }
}

// Factory pattern
export class VisitFactory {
  static create(data: CreateVisitDto): Visit {
    if (data.endTime <= data.startTime) {
      throw new ValidationError('End time must be after start time');
    }
    return new Visit(data);
  }
}
```

---

### 5.2 Finding: Missing Specification Pattern for Complex Queries (MEDIUM)
**Severity:** Medium
**Architectural Impact:** Low

#### Issue
Complex filtering logic is duplicated and embedded in repository queries:
```javascript
// Repeated across multiple files
where: {
  organizationId,
  status: { in: ['PAID', 'SENT'] },
  createdAt: { gte: monthStart },
}
```

#### Recommendation
Use **Specification Pattern**:

```typescript
// src/domain/specifications/invoice-specification.ts
export class InvoiceSpecification {
  static byOrganization(orgId: string) {
    return { where: { organizationId: orgId } };
  }

  static thatAreSentOrPaid() {
    return { where: { status: { in: ['PAID', 'SENT'] } } };
  }

  static inDateRange(start: Date, end: Date) {
    return { where: { createdAt: { gte: start, lte: end } } };
  }

  static combine(...specs: any[]) {
    return specs.reduce((acc, spec) => ({
      ...acc,
      where: { ...acc.where, ...spec.where }
    }), {});
  }
}

// Usage:
const spec = InvoiceSpecification.combine(
  InvoiceSpecification.byOrganization(orgId),
  InvoiceSpecification.thatAreSentOrPaid(),
  InvoiceSpecification.inDateRange(start, end)
);

const result = await prisma.invoice.findMany(spec);
```

---

## 6. Architectural Consistency

### 6.1 Finding: Inconsistent RBAC Implementation (MEDIUM)
**Severity:** Medium
**Architectural Impact:** Medium
**Location:** Throughout API routes

#### Issue
Role-Based Access Control is implemented inconsistently:
- Some routes check `hasRoleAccess` utility
- Some have inline `if (role === 'ADMIN')` checks
- Some skip checks entirely (potential security issue)

**Examples:**
```javascript
// Consistent - using utility
if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER'])) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Inconsistent - inline check
if (session.user.role === 'STAFF') {
  where.staffId = staffRecord.id;
}

// Missing - no check on some DELETE operations
```

#### Recommendation
Implement **RBAC Middleware**:

```javascript
// src/lib/middleware/rbac.js
export function createRBACMiddleware(allowedRoles) {
  return async (request, { params }) => {
    const session = await getServerSession(authOptions);
    if (!session || !hasRoleAccess(session.user.role, allowedRoles)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return { session };
  };
}

// Usage:
export const GET = createRBACMiddleware(['ADMIN', 'MANAGER'])(async (request, ctx) => {
  // Business logic here
});
```

---

### 6.2 Finding: Mixed Date/Time Handling (LOW)
**Severity:** Low
**Architectural Impact:** Low

#### Issue
Date handling mixes `date-fns` utilities with native `Date` objects. No timezone strategy is defined (all dates appear to be in local time or UTC inconsistently).

#### Recommendation
Adopt **Temporal** or **date-fns-tz** with strict UTC storage:

```typescript
// src/lib/datetime.ts
import { z } from 'zod';

export const dateTime = z.coerce.date();

// Always convert to UTC for DB storage
export const toDatabaseDate = (date: Date | string): Date => {
  const d = new Date(date);
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
};

// Always convert to user timezone for display
export const toDisplayDate = (date: Date | string): string => {
  return new Date(date).toLocaleString('en-US', {
    timeZone: 'America/New_York', // or user's timezone
    // ...
  });
};
```

---

## Summary of Recommendations by Priority

### Immediate (Critical/High - Next Sprint)
1. **Standardize error response contracts** across all API routes
2. **Extract business logic from route handlers** into service layer
3. **Add composite database indexes** for query optimization
4. **Refactor ClientForm** using compound component pattern
5. **Implement RBAC middleware** to centralize authorization

### Short Term (Medium - Current Quarter)
1. Implement **Repository pattern** for database abstraction
2. Add **Specification pattern** for complex queries
3. Create **DTOs/View Models** to decouple UI from API
4. Standardize **pagination** across all list endpoints
5. Fix **cascade delete** risks with soft deletes

### Long Term (Low - Technical Debt)
1. Migrate to **Rich Domain Model** (DDD)
2. Implement **caching layer** (Redis) for dashboard stats
3. Add **database views** for frequently aggregated data
4. Standardize **timezone handling** throughout

---

## Architectural Health Score

| Category | Score | Notes |
|----------|-------|-------|
| **Separation of Concerns** | 3/5 | Logic leakage into routes |
| **Dependency Management** | 3/5 | No DI container, risk of circular deps |
| **API Design** | 2/5 | Inconsistent contracts, error handling |
| **Data Model** | 4/5 | Good schema, missing indexes |
| **Design Patterns** | 2/5 | Anemic models, missing abstractions |
| **Consistency** | 3/5 | Mixed patterns, RBAC inconsistency |
| **Overall** | **2.8/5** | **Needs refactoring** |

---

*Generated: 2024-04-13*
*Reviewer: Software Architecture Review System*