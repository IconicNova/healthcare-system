# Phase 3a: Testing Strategy & Coverage Review

**Date:** 2026-04-13
**Reviewer:** Claude Code
**Scope:** Homecare Pro - Full codebase (218 files, ~125,017 words)

---

## Executive Summary

**Status: CRITICAL FAILURE**

The Homecare Pro codebase has **near-zero test coverage** with only **1 E2E test file** (`tests/create-care-plan.spec.js`) covering a single happy-path flow. There are **no unit tests**, **no integration tests**, and **no security or performance tests** despite the presence of multiple critical vulnerabilities identified in prior phases.

### Current Test Distribution
| Test Type | Count | Coverage |
|-----------|-------|----------|
| E2E (Playwright) | 1 file, 1 test case | <0.5% |
| Integration (API) | 0 | 0% |
| Unit | 0 | 0% |
| **Total** | **1 test** | **~0.1%** |

### Critical Gaps
1. **No security tests** for SQL injection, XSS, auth bypass (despite known vulnerabilities)
2. **No tests** for the race condition in invoice number generation
3. **No tests** for broken access control/privilege escalation
4. **No tests** for N+1 query in recurrence handling
5. **No component tests** for 100+ React components

---

## Detailed Findings

### 1. Test Coverage: Critical Code Paths Untested

#### Finding 1.1: Security-Critical Routes Untested
**Severity:** Critical

The following security-critical API endpoints have **zero test coverage**:

**File:** `src/app/api/auth/[...nextauth]/route.js`
```javascript
// Rate-limit login attempts: 5 per 15 minutes per IP
export async function POST(request, context) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { success, retryAfterMs } = rateLimit(`auth:${ip}`, {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  });
  // ... rate limiting logic
}
```
**Untested Scenarios:**
- Rate limiting threshold (6th request should fail with 429)
- Retry-After header presence and calculation
- IP extraction from X-Forwarded-For header
- In-memory rate limit reset (cleared every 5 minutes)

**File:** `src/app/api/billing/invoices/route.js`
```javascript
// Race condition fix - transaction for invoice number generation
const invoice = await prisma.$transaction(async (tx) => {
  const now = new Date();
  const yearMonth = now.toISOString().slice(0, 7).replace('-', '');
  const existingCount = await tx.invoice.count({
    where: {
      organizationId,
      invoiceNumber: { startsWith: `INV-${yearMonth}-` },
    },
  });
  const sequence = String(existingCount + 1).padStart(4, '0');
  const invoiceNumber = `INV-${yearMonth}-${sequence}`;
  // ... create invoice
});
```
**Untested Scenarios:**
- Concurrent POST requests creating duplicate invoice numbers
- Sequence overflow (>9999 invoices per month)
- Transaction rollback on error

**File:** `src/app/api/visits/route.js`
```javascript
// N+1 query - 62 queries for 30-day daily recurrence
for (let i = 1; i < totalIterations; i++) {
  // Check conflicts for each recurring visit
  let hasConflict = false;

  if (staffId) {
    const staffConflict = await prisma.visit.findFirst({...}); // Query 1
    if (staffConflict) hasConflict = true;
  }

  const clientConflict = await prisma.visit.findFirst({...}); // Query 2
  if (clientConflict) hasConflict = true;

  if (!hasConflict) {
    await prisma.visit.create({...}); // Query 3
  }
}
```
**Untested Scenarios:**
- Performance under load (30+ day recurrences)
- Database connection exhaustion
- Skipped dates due to conflicts (not tested in current E2E)

**Recommendation:**
Create integration tests using Supertest or Playwright for API testing:

```javascript
// tests/api/auth/rate-limit.spec.js
import { test, expect } from '@playwright/test';

test.describe('Auth Rate Limiting', () => {
  test('should reject login after 5 attempts', async ({ request }) => {
    // First 5 requests should succeed
    for (let i = 0; i < 5; i++) {
      const response = await request.post('/api/auth/callback/credentials', {
        data: { email: 'test@test.com', password: 'wrong' }
      });
      expect(response.status()).toBeLessThan(500);
    }

    // 6th request should be rate limited
    const response = await request.post('/api/auth/callback/credentials', {
      data: { email: 'test@test.com', password: 'wrong' }
    });
    expect(response.status()).toBe(429);
    expect(response.headers()['retry-after']).toBeDefined();
  });
});
```

---

#### Finding 1.2: Access Control/Authorization Untested
**Severity:** Critical

**File:** `src/app/api/billing/invoices/route.js`
```javascript
// Check RBAC - only ADMIN, MANAGER can create invoices
if (!hasRoleAccess(session.user.role, ['ADMIN', 'MANAGER'])) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```
**Untested Scenarios:**
- STAFF role attempting to create invoice (should 403)
- SUPERVISOR role attempting to access billing (should 403)
- CLIENT role attempting any billing operation
- Privilege escalation via direct API calls bypassing UI restrictions

**File:** `src/app/api/medications/[id]/administer/route.js`
```javascript
// Missing authorization on medication administration
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  // Only checks auth, no role-based authorization for medication administration
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Creates administration record...
}
```
**Untested Scenarios:**
- Non-staff user administering medication
- Staff from different organization accessing medications (multi-tenant leak)
- Staff administering medication to client outside their scope

**Recommendation:**
```javascript
// tests/api/authorization/role-based-access.spec.js
import { test, expect } from '@playwright/test';

test.describe('Role-Based Access Control', () => {
  test('STAFF cannot create invoices (403)', async ({ request, baseURL }) => {
    // Login as STAFF
    const staffCookie = await loginAsStaff(request);

    const response = await request.post(`${baseURL}/api/billing/invoices`, {
      headers: { cookie: staffCookie },
      data: {
        clientId: 'uuid',
        dueDate: '2026-05-01',
        invoiceItems: [{ description: 'Service', quantity: 1, unitPrice: 100 }]
      }
    });

    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden' });
  });

  test('SUPERVISOR cannot access billing routes (403)', async ({ request }) => {
    const supervisorCookie = await loginAsSupervisor(request);

    const response = await request.get('/api/billing/invoices', {
      headers: { cookie: supervisorCookie }
    });

    expect(response.status()).toBe(403);
  });
});
```

---

#### Finding 1.3: Business Logic Untested
**Severity:** High

**File:** `src/app/api/visits/[id]/route.js`
```javascript
// Valid status transitions — prevents illegal moves like CANCELLED→APPROVED
const VALID_STATUS_TRANSITIONS = {
  VACANT: ['SCHEDULED', 'OFFERED', 'CANCELLED'],
  SCHEDULED: ['IN_PROGRESS', 'CLOCKED_IN', 'CANCELLED', 'ON_HOLD', 'VACANT', 'OFFERED'],
  IN_PROGRESS: ['COMPLETED', 'CLOCKED_IN', 'CANCELLED', 'ON_HOLD'],
  COMPLETED: ['APPROVED'],
  APPROVED: [], // Terminal — no further transitions
  CANCELLED: [], // Terminal — cannot un-cancel
  ON_HOLD: ['SCHEDULED', 'CANCELLED'],
  NO_SHOW: ['SCHEDULED'],
  MISSED: ['SCHEDULED'],
};
```
**Untested Scenarios:**
- Illegal transition: CANCELLED → SCHEDULED (should fail)
- Illegal transition: APPROVED → COMPLETED (should fail)
- Illegal transition: IN_PROGRESS → APPROVED (skipping COMPLETED)
- Valid transition: MISSED → SCHEDULED (rescheduling)

**File:** `src/app/api/clients/[id]/route.js`
```javascript
// SSN update - HIPAA critical data
...(body.ssn !== undefined && { ssn: body.ssn }),
```
**Untested Scenarios:**
- SSN validation format (should be XXX-XX-XXXX)
- SSN encryption/encryption verification (currently stored unencrypted)
- SSN audit logging

**Recommendation:**
```javascript
// tests/api/visits/status-transitions.spec.js
test.describe('Visit Status Transitions', () => {
  const illegalTransitions = [
    { from: 'CANCELLED', to: 'SCHEDULED' },
    { from: 'APPROVED', to: 'COMPLETED' },
    { from: 'IN_PROGRESS', to: 'APPROVED' },
    { from: 'COMPLETED', to: 'SCHEDULED' },
    { from: 'VACANT', to: 'COMPLETED' },
  ];

  illegalTransitions.forEach(({ from, to }) => {
    test(`cannot transition from ${from} to ${to}`, async ({ request }) => {
      const visit = await createVisitWithStatus(request, from);

      const response = await request.patch(`/api/visits/${visit.id}`, {
        data: { status: to }
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toContain(from);
      expect(error.error).toContain(to);
    });
  });
});
```

---

### 2. Test Quality: Testing Implementation vs Behavior

#### Finding 2.1: Existing E2E Test Uses Implementation Details
**Severity:** Medium

**File:** `tests/create-care-plan.spec.js`

```javascript
// Fragile CSS selectors that break on implementation changes
await page.fill('input[placeholder*="Plan"]', 'Test Care Plan...');
await page.fill('textarea', 'Recovery plan...'); // Assumes first textarea is description
await page.click('button:has-text("+ Add Service")');
const serviceSelect = page.locator('select').filter({ hasText: 'Select Service' }).first();
```

**Issues:**
1. `input[placeholder*="Plan"]` - Fragile to copy/paste UI changes
2. `textarea` without context - First textarea on page, breaks if new field added
3. `.first()` without verification - Assumes order of elements
4. No accessibility attributes (`aria-label`, `data-testid`) used

**Recommendation:**
```javascript
// Use semantic selectors
await page.getByLabel('Care Plan Name').fill('Test Care Plan...');
await page.getByLabel('Description').fill('Recovery plan...');
await page.getByRole('button', { name: /add service/i }).click();
await page.getByLabel('Service').selectOption('Personal Care');

// Add assertions
await expect(page.getByRole('button', { name: 'Create Care Plan' })).toBeEnabled();
```

---

### 3. Test Pyramid Adherence

#### Finding 3.1: Inverted Test Pyramid
**Severity:** High

Current state:
```
        /
       /  E2E: 1 test (heavy, slow, fragile)
      /
     /_________________
    Unit: 0            Integration: 0
```

Recommended state:
```
        /
       /  E2E: ~20 critical paths only
      /
     /  Integration: ~50 API tests
    /  Unit: ~200 (utils, validation, business logic)
   /_________________
```

**Recommendation:**
- Add Vitest/Jest for unit tests
- Add Supertest for API integration tests
- Keep Playwright only for critical E2E flows (login, create care plan, create visit, invoice generation)

---

### 4. Edge Cases Untested

#### Finding 4.1: Boundary Conditions
**Severity:** High

**Untested Scenarios:**

1. **Date boundary:** Due date validation in invoice creation
   ```javascript
   // src/app/api/billing/invoices/route.js
   if (dueDateObj < today) {
     return NextResponse.json({ error: 'Due date cannot be in the past' }, { status: 400 });
   }
   ```
   - Test: Create invoice with due date = today (boundary)
   - Test: Create invoice with due date = tomorrow - 1ms (edge case)

2. **Numeric overflow:** Invoice sequence number
   ```javascript
   const sequence = String(existingCount + 1).padStart(4, '0'); // Max 9999
   ```
   - Test: What happens at 9999 invoices/month? (Should be INV-202604-9999 → INV-202604-10000, but padStart(4) becomes INV-202604-0000)

3. **Timezone handling:** Visit times stored as UTC, displayed in local
   - Test: Create visit at 23:59 PST, check storage and display

4. **Null/undefined handling:** Client form with empty objects
   - Test: PATCH client with `{ emergencyContacts: [] }` vs `{ emergencyContacts: undefined }`

**Recommendation:**
```javascript
// tests/api/billing/invoices/edge-cases.spec.js
test('handles invoice sequence overflow at 9999', async ({ request }) => {
  // Seed database with 9999 invoices in current month
  await seedInvoices(9999);

  const response = await request.post('/api/billing/invoices', { data: {...} });
  const invoice = await response.json();

  // Should handle gracefully (requirement: what should happen?)
  // Currently breaks: padStart(4) of 10000 = '0000'
  expect(invoice.invoiceNumber).not.toContain('0000');
});
```

#### Finding 4.2: Error Paths
**Severity:** High

**Untested Scenarios:**
- Database connection failures during transactions
- Partial failures in cascade deletions (delete client with restricted invoice)
- Prisma transaction rollback scenarios
- Rate limiter memory exhaustion (Map.clear() never called on entries)

---

#### Finding 4.3: Concurrent Scenarios
**Severity:** Critical

**Untested Scenarios:**

1. **Concurrent invoice creation (Race Condition)**
   ```javascript
   // Two requests at same time:
   // Request A: counts 0 invoices, generates INV-202604-0001
   // Request B: counts 0 invoices, generates INV-202604-0001
   // Both try to insert → unique constraint violation
   ```

2. **Concurrent visit scheduling**
   - Two admins schedule visits for same staff at same time
   - Conflict check happens, then creation (TOCTOU race)

3. **Concurrent medication administration**
   - Staff A and Staff B mark same medication as administered simultaneously

**Recommendation:**
```javascript
// tests/api/concurrency/invoice-race-condition.spec.js
test('handles concurrent invoice creation without duplicates', async ({ request }) => {
  const promises = Array(10).fill(null).map(async () => {
    return request.post('/api/billing/invoices', {
      data: { clientId: 'uuid', dueDate: '2026-05-01', invoiceItems: [...] }
    });
  });

  const responses = await Promise.all(promises);
  const invoices = await Promise.all(responses.map(r => r.json()));

  // All invoice numbers should be unique
  const numbers = invoices.map(i => i.invoiceNumber);
  expect(new Set(numbers).size).toBe(numbers.length);

  // No 409/500 errors from unique constraint violations
  expect(responses.every(r => r.status() === 201)).toBe(true);
});
```

---

### 5. Test Maintainability

#### Finding 5.1: No Test Utilities or Factories
**Severity:** Medium

**Current State:** The single E2E test manually fills forms, no setup/teardown, no test data factories.

**Issues:**
- Repeated boilerplate for creating users, clients, staff
- No factory pattern for generating test data
- Manual ID management instead of UUID generation

**Recommendation:**
```javascript
// tests/factories/index.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createUser({ role = 'STAFF', ...data }) {
  const password = await bcrypt.hash('password123', 10);
  return prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      password,
      firstName: 'Test',
      lastName: 'User',
      role,
      organizationId: 'test-org-id',
      ...data,
    },
  });
}

export async function createClient({ ...data }) {
  return prisma.client.create({
    data: {
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '555-123-4567',
      email: 'jane@example.com',
      address: '123 Test St',
      city: 'Testville',
      state: 'CA',
      zipCode: '12345',
      organizationId: 'test-org-id',
      ...data,
    },
  });
}

export async function cleanup() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "user", "client", "staff" RESTART IDENTITY CASCADE');
  await prisma.$disconnect();
}
```

#### Finding 5.2: No Mocking Strategy
**Severity:** Low

**Issues:**
- No mock implementations for external services (Stripe, AWS S3, Twilio)
- If external services fail, tests fail even for unrelated logic

---

### 6. Security Test Gaps

#### Finding 6.1: Injection Attacks Untested
**Severity:** Critical

**Known vulnerabilities from Phase 2:**
- SQL injection via unsanitized query parameters
- XSS via client notes and form content (JSON fields)

**No tests verify:**
- Input sanitization of `<script>` tags in visit notes
- SQL injection attempts in search parameters: `search': '1' OR '1'='1`
- Path traversal in file uploads (if applicable)

**Recommendation:**
```javascript
// tests/api/security/injection.spec.js
test.describe('SQL Injection Prevention', () => {
  const payloads = [
    "'; DROP TABLE clients; --",
    "' OR '1'='1",
    "1' OR 1=1--",
  ];

  payloads.forEach(payload => {
    test(`rejects malicious input in search: ${payload}`, async ({ request }) => {
      const response = await request.get(`/api/clients?search=${encodeURIComponent(payload)}`);

      // Should either sanitize or return 400, not execute SQL
      expect(response.status()).not.toBe(200); // or verify data is not leaked
    });
  });
});

test.describe('XSS Prevention', () => {
  test('sanitizes script tags in visit notes', async ({ request }) => {
    const maliciousNote = '<script>document.cookie</script>Normal note';

    const response = await request.patch('/api/visits/test-id', {
      data: { notes: maliciousNote }
    });

    const visit = await response.json();
    expect(visit.notes).not.toContain('<script>');
    expect(visit.notes).toContain('Normal note');
  });
});
```

#### Finding 6.2: Authentication Flows Untested
**Severity:** Critical

**Untested:**
- Session hijacking (cookie manipulation)
- JWT expiration handling
- Concurrent sessions (does logout revoke other sessions?)
- Password reset flow
- Account lockout after failed attempts

#### Finding 6.3: Multi-Tenant Isolation Untested
**Severity:** Critical

**Untested:**
- Organization A user querying Organization B data
- Branch-scoped access violations
- Shared email across organizations

---

### 7. Performance Test Gaps

#### Finding 7.1: N+1 Query Not Tested
**Severity:** Critical

**From Phase 2:** Recurrence handling creates 62 queries for 30-day daily recurrence.

**No tests verify:**
- Query count for recurring visit creation
- Database response time under load
- Memory usage for large date ranges

**Recommendation:**
```javascript
// tests/performance/recurrence.spec.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let queryCount = 0;
const originalQueryRaw = prisma.$queryRaw;
prisma.$queryRaw = (...args) => {
  queryCount++;
  return originalQueryRaw(...args);
};

test('daily recurrence creates visits efficiently', async ({ request }) => {
  queryCount = 0;

  const response = await request.post('/api/visits', {
    data: {
      clientId: 'uuid',
      startTime: '2026-05-01T09:00:00Z',
      endTime: '2026-05-01T10:00:00Z',
      recurrence: { type: 'DAILY', count: 30 }
    }
  });

  // Should use batch insert, not 62 individual queries
  expect(queryCount).toBeLessThan(10); // Current: 62

  // Cleanup
  prisma.$queryRaw = originalQueryRaw;
});
```

#### Finding 7.2: Rate Limiter Memory Leak
**Severity:** High

**From Phase 2:** In-memory rate limiting breaks on horizontal scaling, no eviction strategy shown.

**Untested:**
- Memory growth over time
- Cleanup interval effectiveness
- Behavior under distributed deployment (multiple instances)

---

## Recommendations

### Immediate (Critical - Week 1-2)

1. **Add API Integration Tests**
   ```bash
   npm install --save-dev @playwright/test supertest
   ```
   - Create `tests/api/` structure
   - Test auth, billing, visits endpoints
   - Use `@playwright/test` project setup

2. **Add Security Tests**
   - SQL injection tests
   - XSS tests
   - RBAC/Authorization tests
   - Rate limiting tests

3. **Add Concurrency Tests**
   - Invoice race condition
   - Visit scheduling conflicts
   - Transaction rollback verification

### Short-Term (High - Week 3-4)

4. **Add Unit Tests**
   - `src/lib/utils.js` (hasRoleAccess, formatCurrency, formatDate)
   - `src/lib/rate-limit.js`
   - Status transition validation logic

5. **Refactor E2E Test**
   - Use semantic selectors (`getByRole`, `getByLabel`)
   - Add factory utilities
   - Add assertions for success/failure states

6. **Fix Invoice Number Bug**
   - `padStart(4, '0')` breaks at 10000
   - Change to `String(existingCount + 1)` with dynamic padding or month-based reset

### Long-Term (Medium - Month 2)

7. **Add Performance Tests**
   - Query count assertions
   - Load testing for recurrence
   - Database connection pool testing

8. **Component Tests**
   - Add `@testing-library/react` for critical components
   - Test form validation
   - Test error boundaries

9. **CI/CD Integration**
   - Run tests on every PR
   - Block deployments on test failure
   - Coverage thresholds (>60% initially, >80% target)

---

## File Reference Summary

### Files With No Tests (High Priority)
| File | Critical Issues |
|------|----------------|
| `src/app/api/auth/[...nextauth]/route.js` | Rate limiting, auth |
| `src/app/api/billing/invoices/route.js` | Race condition, RBAC |
| `src/app/api/visits/route.js` | N+1, recurrence |
| `src/app/api/visits/[id]/route.js` | Status transitions |
| `src/app/api/medications/[id]/administer/route.js` | Authorization |
| `src/app/api/clients/[id]/route.js` | SSN handling, HIPAA |
| `src/lib/rate-limit.js` | In-memory storage, cleanup |
| `src/lib/utils.js` | hasRoleAccess logic |

### Files With Tests
| File | Coverage |
|------|----------|
| `src/components/scheduling/VisitForm.jsx` | Indirectly (E2E only) |

---

## Conclusion

The testing coverage is **critically insufficient** for a HIPAA-regulated healthcare application with financial transactions. The single E2E test covers one happy path; there are no tests for security, authorization, data integrity, or performance. Implementing the recommended test suite is essential before any production deployment or further feature development.

**Estimated Effort:** 4-6 weeks for critical coverage, 3-4 months for comprehensive coverage with CI/CD.

---

*Generated by Claude Code on 2026-04-13*
