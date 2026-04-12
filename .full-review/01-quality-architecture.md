# Phase 1: Code Quality & Architecture Review

## Code Quality Findings

### Critical Issues

| Issue | File | Location | Severity | Description |
|-------|------|----------|----------|-------------|
| Date field mismatch in generate-batch | `src/app/api/billing/invoices/generate-batch/route.js` | Lines 42-46, 68 | Critical | Uses non-existent `date` field instead of `startTime` |
| Date field mismatch in timesheets/generate | `src/app/api/payroll/timesheets/generate/route.js` | Lines 42-46, 61 | Critical | Same `date` field issue for Visit model |
| Date field mismatch in uninvoiced-visits | `src/app/api/billing/invoices/uninvoiced-visits/route.js` | Lines 40-44 | Critical | Uses `date` field instead of `startTime` |

### High Issues

| Issue | File | Location | Severity | Description |
|-------|------|----------|----------|-------------|
| Complex transaction logic | `src/app/api/clients/[id]/route.js` | Lines 147-286 | High | 140-line transaction violates SRP |
| High cyclomatic complexity | `src/components/scheduling/VisitForm.jsx` | Lines 103-130 | High | validateForm has 15+ conditions |
| Missing input validation | `src/app/api/medications/[id]/administer/route.js` | Lines 17, 61 | High | No enum validation for status field |
| REST violation | `src/components/billing/GenerateBatchModal.jsx` | Lines 45-52 | High | POST used for fetching data (should be GET) |

### Medium Issues

| Issue | File | Location | Severity | Description |
|-------|------|----------|----------|-------------|
| Hardcoded role hierarchy | `src/lib/utils.js` | Lines 171-183 | Medium | Role permissions not extensible |
| Password error handling | `src/lib/auth.js` | Lines 28-38 | Medium | Prevents custom auth messages |
| Duplicated hours calculation | Multiple files | N/A | Medium | Same logic in 3+ places |
| Missing audit logging | `src/app/api/clients/[id]/route.js` | N/A | Medium | AuditLog model unused |

### Low Issues

| Issue | File | Location | Severity | Description |
|-------|------|----------|----------|-------------|
| Incomplete error boundary | `src/components/clients/ClientForm.jsx` | N/A | Low | Raw errors shown to users |
| Missing null checks | `src/components/scheduling/VisitForm.jsx` | Lines 183-186 | Low | Potential runtime errors |
| TimezoneOffset inconsistency | `src/components/care-delivery/EditVisitDialog.jsx` | Lines 225-226 | Low | Manual timezone handling |
| Inconsistent date formatting | Multiple components | N/A | Low | No project-wide convention |

---

## Architecture Findings

### Critical Issues

1. **Soft Delete Missing**
   - Impact: Data loss irreversible, audit trail incomplete, compliance issues
   - Recommendation: Add `isDeleted` and `deletedAt` fields to all key models

2. **Missing Audit Fields**
   - Impact: Cannot track who made changes
   - Recommendation: Add `createdBy` and `updatedBy` fields to all models

3. **Data Type Inconsistencies**
   - Staff `role` is String instead of enum (unlike UserRole)
   - Impact: No DB-level validation, potential typos
   - Recommendation: Create StaffRole enum

4. **Missing Indexes**
   - Impact: Slow queries on `organizationId`, `startTime`, foreign keys
   - Recommendation: Add explicit indexes for common query patterns

### High Issues

1. **Circular Dependency Risk**
   - User/Staff/Client models have optional cross-relations
   - Impact: Ambiguous domain model, data integrity issues
   - Recommendation: Enforce exclusivity at application level

2. **Missing Authentication Abstraction**
   - Session checks duplicated in every route
   - Impact: Code duplication, inconsistent error handling
   - Recommendation: Create middleware for auth

3. **Inconsistent Error Responses**
   - Some return `{ error: 'message' }`, others expose stack traces
   - Recommendation: Implement structured error handling with ApiError class

4. **Missing Request/Response Validation**
   - No Zod schemas consistently applied
   - Recommendation: Use Zod for all API route validation

### Medium Issues

1. **Overloaded API Routes**
   - Business logic (conflict detection, recurrence) directly in routes
   - Impact: Low testability, difficult to reuse
   - Recommendation: Extract to domain service classes

2. **Missing Repository Pattern**
   - Every route directly accesses Prisma
   - Impact: Tight coupling, difficult testing
   - Recommendation: Implement repository pattern

3. **Inconsistent RBAC Implementation**
   - Multiple role-checking patterns across routes
   - Impact: Security gaps, maintenance issues
   - Recommendation: Create centralized authorize middleware

4. **Missing DTO Layer**
   - Database entities returned directly
   - Impact: Internal details exposed, inflexible responses
   - Recommendation: Create DTOs for API responses

---

## Critical Issues for Phase 2 Context

### Immediate Security Concerns

1. **Password Handling in Staff Avatar Creation**
   - Creates users with random passwords (cannot login)
   - File: `src/app/api/staff/[id]/avatar/route.js`
   - Risk: Prevents legitimate staff from accessing their accounts

2. **No Rate Limiting**
   - API routes unprotected against brute force
   - Recommendation: Implement rate limiting middleware

3. **No Input Sanitization**
   - User inputs not sanitized for XSS
   - Recommendation: Sanitize HTML inputs before storing

### Performance Concerns

1. **Database Query Efficiency**
   - Missing indexes on `organizationId`, `startTime`
   - Potential N+1 queries from direct Prisma usage

2. **Transaction Overhead**
   - Large transactions (140+ lines) may cause locks
   - Recommendation: Break into smaller units
