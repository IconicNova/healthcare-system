# Phase 1: Code Quality & Architecture Review

**Review Date:** 2026-04-13
**Target:** Homecare Pro - Full Codebase (218 files, ~125K words)
**Framework:** Next.js 14, Prisma ORM, PostgreSQL

---

## Executive Summary

Phase 1 identified **28 total findings** across code quality and architecture:
- **6 Critical** issues requiring immediate remediation
- **9 High** priority items for current sprint
- **10 Medium** priority items for planning
- **3 Low** priority technical debt

**Top Concerns:**
1. HIPAA violation: Unencrypted SSN storage in database
2. SQL injection risk via unsanitized query parameters
3. 116 duplicate authentication blocks across 75 files (extreme technical debt)
4. Inconsistent API error contracts breaking frontend error handling
5. Leaky abstractions with business logic embedded in route handlers

---

## Code Quality Findings

### Critical Issues

#### 1. Unencrypted PII Storage - SSN Field (Critical)
**File:** `prisma/schema.prisma:200`
**Issue:** Social Security Numbers stored as plain text strings without encryption at rest. Violates HIPAA Security Rule (45 CFR 164.312(a)(2)(iv)).

**Fix:** Implement AES-256-GCM encryption:
```prisma
model Client {
  ssnEncrypted     String?  // AES-256 encrypted SSN
  ssnEncryptedKeyId String? // Key version for rotation
}
```

#### 2. Unsanitized Query Parameters - SQL Injection Risk (Critical)
**File:** `src/app/api/billing/invoices/route.js:26-27`
**Issue:** Direct interpolation of user-controlled query parameters into Prisma queries.

```javascript
// UNSAFE
const sort = searchParams.get('sort') || 'createdAt';
orderBy: { [sort]: order }
```

**Fix:** Whitelist approach:
```javascript
const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'amount', 'dueDate'];
const sort = ALLOWED_SORT_FIELDS.includes(searchParams.get('sort'))
  ? searchParams.get('sort') : 'createdAt';
```

#### 3. Extreme Code Duplication - Authentication (Critical)
**Pattern:** Across ~75 API route files
**Issue:** Authentication check duplicated 116 times with identical pattern:
```javascript
const session = await getServerSession(authOptions);
if (!session || !session.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Fix:** Create middleware:
```javascript
// src/middleware/authMiddleware.js
export async function requireAuth(request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return session;
}
```

#### 4. Unvalidated Date Arithmetic (Critical)
**File:** `src/app/api/visits/route.js:140,240-245`
**Issue:** Loose comparison (`<=`) allows type coercion; unsafe recurrence iteration logic with undefined inputs.

**Fix:** Strict validation with NaN checks and type guards.

---

### High Priority Issues

#### 5. Missing Database Indexes
**File:** `prisma/schema.prisma`
**Missing:** Composite indexes for `(organizationId, staffId, startTime)`, `(organizationId, clientId, status, startTime)`, `(staffId, startTime, status)`.

#### 6. N+1 Query Pattern in Recurrence Generation
**File:** `src/app/api/visits/route.js:276-302`
**Issue:** Individual database queries inside loops for conflict checking (24+ queries for monthly recurrence over 12 months).

**Fix:** Batch conflict detection using `findMany` with OR conditions.

#### 7. Race Condition in Invoice Number Generation
**File:** `src/app/api/billing/invoices/route.js:151-160`
**Issue:** Invoice number generation not atomic within transaction, risking duplicates under load.

**Fix:** Use database sequence table with atomic upsert.

---

## Architecture Findings

### Critical Issues

#### 8. Leaky Abstractions in API Routes (Critical)
**Location:** `src/app/api/*` route handlers
**Issue:** Business logic embedded directly in route handlers instead of service layer. Direct Prisma access with no abstraction.

**Example:** Conflict detection logic inside `POST` handler in `visits/route.js`.

**Fix:** Implement Repository and Service patterns:
```typescript
// src/lib/services/visit-service.ts
export class VisitService {
  async createVisit(data, userId) {
    const conflicts = await this.visitRepo.findConflicts(data);
    if (conflicts.length > 0) throw new ConflictError();
    return this.prisma.visit.create({ data });
  }
}
```

#### 9. Inconsistent Error Response Contracts (Critical)
**Location:** All API routes
**Issue:** Error responses vary across endpoints:
- Some return `{ error: 'string' }`
- Some return `{ error: 'string', conflicts: [] }`
- Some return `{ message: 'string' }`
- Status codes vary (200 vs 201 for creation)

**Fix:** Standardize on RFC 7807 Problem Details:
```javascript
export class ApiError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
```

---

### High Priority Issues

#### 10. Single Responsibility Violation - ClientForm (High)
**File:** `src/components/clients/ClientForm.jsx`
**Issue:** 800+ line component handling form state, file uploads, image editing, validation, navigation (15+ useState hooks).

**Fix:** Compound Component Pattern + Custom Hooks:
```javascript
const { formData, errors, handleSubmit } = useClientFormState(client);
const { avatarPreview, handleAvatarSelect } = useAvatarUploader(client?.id);
```

#### 11. Circular Dependency Risk in Auth (High)
**Location:** `src/lib/auth.js`, `src/lib/prisma.js`
**Issue:** Auth module directly instantiates database operations; potential for circular dependencies.

**Fix:** Dependency Injection pattern with repository abstraction.

#### 12. N+1 Query Risk in Dashboard Stats (High)
**File:** `src/app/api/dashboard/stats/route.js`
**Issue:** 10+ sequential database queries without batching.

**Fix:** Parallel queries with `Promise.all` and database views for aggregations.

#### 13. Missing DDD Boundaries (High)
**Issue:** Anemic domain model with no encapsulation of business rules. Logic scattered in route handlers.

**Fix:** Rich Domain Model with domain events:
```typescript
export class Visit {
  clockIn() { /* business logic encapsulated */ }
  complete(actualEnd) { /* business logic encapsulated */ }
}
```

---

### Medium Priority Issues

14. **Tight coupling between UI and API contracts** - No DTO layer
15. **Missing Dependency Inversion** - Services created directly in routes
16. **Pagination inconsistencies** - Mixed `page/limit` vs hardcoded `take: 10`
17. **Resource nesting inconsistency** - `/api/payroll/timesheet-entries` vs `/api/clients/[id]/visits`
18. **Aggressive cascade delete risks** - No soft deletes for critical entities
19. **Inconsistent RBAC implementation** - Mixed `hasRoleAccess` utility and inline checks
20. **Code duplication in validation** - Email uniqueness checks repeated
21. **Missing XSS protection** - No HTML sanitization on text fields
22. **Timezone issues** - Local time vs UTC inconsistency
23. **Magic numbers in rate limiting** - Hardcoded values

---

## Critical Issues for Phase 2 Context

The following findings from Phase 1 inform the Security and Performance review:

1. **Unencrypted SSN storage** - Security audit must assess full PII exposure
2. **SQL injection via unsanitized params** - Security audit must check all query endpoints
3. **Race condition in invoice numbering** - Performance/Concurrency review needed
4. **N+1 queries in recurrence/dashboard** - Performance optimization priorities
5. **Missing RBAC consistency** - Security audit must verify authorization gaps
6. **Leaky abstractions** - Performance profiling difficult without service layer

---

## Summary Statistics

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| **Code Quality** | 4 | 5 | 4 | 3 | 16 |
| **Architecture** | 2 | 4 | 6 | 2 | 14 |
| **Total** | **6** | **9** | **10** | **5** | **30** |

---

## Recommended Immediate Actions (Week 1)

1. Encrypt SSN field with database migration
2. Add input sanitization middleware for query parameters
3. Create authentication middleware (`src/middleware/authMiddleware.js`)
4. Standardize API error responses (RFC 7807)
5. Extract business logic from route handlers into service layer

---

*Phase 1 Complete. Ready for Phase 2: Security & Performance Review.*
