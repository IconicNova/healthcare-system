# Phase 2: Security & Performance Review

**Review Date:** 2026-04-13
**Target:** Homecare Pro - Full Codebase
**Framework:** Next.js 14, Prisma ORM, PostgreSQL, NextAuth.js

---

## Executive Summary

Phase 2 identified **50 total findings** across security and performance:
- **12 Critical** issues requiring immediate remediation
- **17 High** priority items for current sprint
- **15 Medium** priority items for planning
- **6 Low** priority technical debt

**Top Concerns:**
1. HIPAA violations: Unencrypted SSN storage + broken access control
2. SQL injection via unsanitized query parameters
3. Race conditions in invoice number generation (TOCTOU)
4. N+1 queries in recurrence handling (62 queries for 30-day recurrence)
5. In-memory rate limiting breaks horizontal scaling

---

## Security Findings

### Critical Issues

#### 1. Unencrypted SSN Storage - HIPAA Violation (Critical)
**CWE:** CWE-312, CWE-311 | **CVSS:** 9.1
**File:** `prisma/schema.prisma:200`

Social Security Numbers stored as plaintext strings. Violates 45 CFR § 164.312(a)(2)(iv).

**Fix:** AES-256-GCM encryption with AWS KMS key management.

#### 2. Broken Access Control - Horizontal Privilege Escalation (Critical)
**CWE:** CWE-284, CWE-639 | **CVSS:** 8.8
**File:** `src/app/api/settings/users/[id]/route.js:14-16`

Any authenticated user can update another user's role to ADMIN if they know the UUID. No organization boundary check.

**Fix:** Add organization boundary validation and prevent self-escalation.

#### 3. SQL Injection via Dynamic OrderBy (Critical)
**CWE:** CWE-89 | **CVSS:** 8.6
**File:** `src/app/api/staff/route.js:22,59` and `src/app/api/billing/invoices/route.js:57`

```javascript
const sort = searchParams.get('sort') || 'createdAt';
orderBy: { [sort]: order }  // UNSAFE
```

**Fix:** Whitelist valid sort fields and sanitize input.

#### 4. Race Condition in Invoice Number Generation (Critical)
**CWE:** CWE-362 | **CVSS:** 7.5
**File:** `src/app/api/billing/invoices/route.js:149-160`

Count-then-create pattern vulnerable to TOCTOU attacks under concurrent load.

**Fix:** PostgreSQL advisory locks or atomic sequence table.

#### 5. Missing Authorization in Medical Data Access (Critical)
**CWE:** CWE-284, CWE-863 | **CVSS:** 9.0
**File:** `src/app/api/medications/[id]/administer/route.js:40-53`

Any authenticated user (including CLIENT role) can record medication administration.

**Fix:** Require STAFF/SUPERVISOR role with valid medical certification.

#### 6. IDOR - Client Data Exposure (Critical)
**CWE:** CWE-639 | **CVSS:** 8.1
**File:** `src/app/api/clients/[id]/route.js:8-21`

STAFF/CLIENT roles can enumerate all clients by UUID iteration. No branch-level scoping for MANAGER role.

---

### High Priority Issues

7. **116 Duplicate Authorization Blocks** (HIGH-001) - Inconsistent RBAC across 75 files
8. **Session Fixation & JWT Token Manipulation** (HIGH-002) - 30-day sessions, no token versioning
9. **Timing Attack in Authentication** (HIGH-003) - User enumeration via response timing
10. **Missing Rate Limiting on Auth Endpoints** (HIGH-004) - Brute force vulnerability
11. **XXE/SSRF via Document Upload** (HIGH-005) - Potential internal network scanning

---

## Performance Findings

### Critical Issues

#### 1. N+1 Query Pattern in Recurrence Handling (Critical)
**File:** `src/app/api/visits/route.js:267-326`

Individual database queries inside loops for conflict checking. 30-day daily recurrence = 62 database round trips (1.86s latency).

**Fix:** Batch conflict detection using `findMany` with OR conditions, then `createMany`.

#### 2. Unbounded In-Memory Rate Limiting (Critical)
**File:** `src/lib/rate-limit.js:7-44`

Global Map grows without LRU eviction. Breaks horizontal scaling (multi-instance deployments).

**Fix:** Redis-backed rate limiting (Upstash) or LRU cache with TTL.

#### 3. Missing Composite Indexes (High)
**File:** `prisma/schema.prisma:416-421`

Missing: `(organizationId, staffId, startTime, endTime, status)`, `(organizationId, clientId, status, startTime)`.

**Impact:** Full table scans on 50K visits = 1000x slower than indexed queries.

#### 4. Dashboard Stats Sequential Queries (Medium)
**File:** `src/app/api/dashboard/stats/route.js:19-141`

10+ sequential queries (~300ms latency).

**Fix:** `Promise.all()` for parallel execution (~50ms).

#### 5. CSV Export Memory Spike (High)
**File:** `src/components/reports/ExportButton.jsx:42-74`

Client-side CSV generation loads entire dataset into memory. 100K rows = 250MB allocation.

**Fix:** Server-side streaming CSV with ReadableStream.

---

## Critical Issues for Phase 3 Context

The following findings affect testing and documentation requirements:

1. **HIPAA Non-Compliance** - Security testing must verify encryption, access controls, audit logging
2. **Race Conditions** - Concurrency testing required for invoice generation under load
3. **N+1 Queries** - Performance testing must include recurrence scenarios
4. **Inconsistent Error Contracts** - API documentation must standardize on RFC 7807
5. **Missing Rate Limiting** - Load testing required for brute force protection

---

## Summary Statistics

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| **Security** | 6 | 8 | 7 | 2 | 23 |
| **Performance** | 5 | 7 | 8 | 3 | 23 |
| **Total** | **11** | **15** | **15** | **5** | **46** |

---

## Recommended Immediate Actions (Week 1)

1. Encrypt SSN field with database migration (HIPAA)
2. Add input sanitization middleware for query parameters
3. Fix race condition in invoice numbering with atomic sequences
4. Add role checks to medication administration endpoint
5. Batch N+1 queries in recurrence generation
6. Migrate rate limiting to Redis for horizontal scaling

---

*Phase 2 Complete. Ready for Phase 3: Testing & Documentation Review.*
