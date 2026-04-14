# Care Delivery Forms Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a central forms review queue, strengthen client-level form verification, improve medication administration workflow fidelity, and expand tutorial-aligned charting templates while preserving the current HomeCare Pro UI structure.

**Architecture:** Build one shared form-review lifecycle across the API layer and expose it through two UI surfaces: a new cross-client queue at `/care-delivery/forms/review` and the existing client `Forms` tab. Keep the existing form page as the single charting/review surface, refine medication event selection in place, and expand the seeded charting templates without replacing the renderer.

**Tech Stack:** Next.js App Router, React client components, Prisma, NextAuth session-backed APIs, Node assert-based tests, ESLint, Next.js build pipeline

---

## File Map

### Create

- `src/app/(dashboard)/care-delivery/forms/review/page.js`
- `src/components/care-delivery/FormsReviewQueue.jsx`
- `src/components/care-delivery/forms-review.helpers.js`
- `src/app/api/forms/review/route.js`
- `tests/forms-review.helpers.test.mjs`
- `tests/forms-review-route.test.mjs`
- `tests/charting-template-shapes.test.mjs`

### Modify

- `src/components/care-delivery/CareDeliveryLayout.jsx`
- `src/app/api/forms/[id]/route.js`
- `src/components/clients/ClientFormsTab.jsx`
- `src/app/(dashboard)/care-delivery/forms/[formId]/page.js`
- `src/app/(dashboard)/care-delivery/medications/page.js`
- `src/app/api/medications/[id]/administer/route.js`
- `src/lib/charting-templates.js`
- `prisma/seed.js`

### Existing tests to preserve

- `tests/charting-templates.test.mjs`
- `tests/edit-visit-forms.test.mjs`

---

### Task 1: Define Form Review Lifecycle Helpers

**Files:**
- Create: `tests/forms-review.helpers.test.mjs`
- Create: `src/components/care-delivery/forms-review.helpers.js`

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import {
  getReviewableStatuses,
  canTransitionFormStatus,
  normalizeRejectionReason,
  buildReviewQueueFilters,
} from '../src/components/care-delivery/forms-review.helpers.js';

function run() {
  assert.deepEqual(getReviewableStatuses(), ['SUBMITTED', 'IN_REVIEW']);

  assert.equal(canTransitionFormStatus('SUBMITTED', 'IN_REVIEW', {}), true);
  assert.equal(canTransitionFormStatus('IN_REVIEW', 'APPROVED', {}), true);
  assert.equal(canTransitionFormStatus('DRAFT', 'APPROVED', {}), false);
  assert.equal(
    canTransitionFormStatus('SUBMITTED', 'REJECTED', { rejectionReason: '' }),
    false
  );
  assert.equal(
    canTransitionFormStatus('SUBMITTED', 'REJECTED', { rejectionReason: 'Missing signature' }),
    true
  );

  assert.equal(normalizeRejectionReason('  Missing signature  '), 'Missing signature');
  assert.equal(normalizeRejectionReason('   '), '');

  assert.deepEqual(
    buildReviewQueueFilters({
      status: 'SUBMITTED',
      clientId: 'client-1',
      templateId: 'template-1',
      dateFrom: '2026-04-01',
      dateTo: '2026-04-30',
    }),
    {
      status: 'SUBMITTED',
      clientId: 'client-1',
      templateId: 'template-1',
      dateFrom: '2026-04-01',
      dateTo: '2026-04-30',
    }
  );
}

run();
console.log('forms-review.helpers tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/forms-review.helpers.test.mjs`
Expected: FAIL with module export or missing file errors for `forms-review.helpers.js`

- [ ] **Step 3: Write minimal implementation**

```js
export function getReviewableStatuses() {
  return ['SUBMITTED', 'IN_REVIEW'];
}

export function normalizeRejectionReason(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function canTransitionFormStatus(currentStatus, nextStatus, options = {}) {
  if (currentStatus === 'DRAFT' && nextStatus !== 'SUBMITTED') {
    return false;
  }

  if (nextStatus === 'REJECTED') {
    return normalizeRejectionReason(options.rejectionReason).length > 0;
  }

  const validTransitions = {
    DRAFT: ['SUBMITTED'],
    SUBMITTED: ['IN_REVIEW', 'APPROVED', 'REJECTED'],
    IN_REVIEW: ['APPROVED', 'REJECTED'],
    APPROVED: [],
    REJECTED: ['IN_REVIEW'],
  };

  return (validTransitions[currentStatus] || []).includes(nextStatus);
}

export function buildReviewQueueFilters(searchParams) {
  return {
    status: searchParams.status || '',
    clientId: searchParams.clientId || '',
    templateId: searchParams.templateId || '',
    dateFrom: searchParams.dateFrom || '',
    dateTo: searchParams.dateTo || '',
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/forms-review.helpers.test.mjs`
Expected: PASS with `forms-review.helpers tests passed`

- [ ] **Step 5: Commit**

```bash
git add tests/forms-review.helpers.test.mjs src/components/care-delivery/forms-review.helpers.js
git commit -m "test: add form review lifecycle helpers"
```

---

### Task 1a: Align FormStatus Schema With The Review Lifecycle

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/app/api/forms/[id]/route.js`
- Modify: `src/app/api/visits/[id]/forms/route.js`
- Modify: `src/app/(dashboard)/care-delivery/forms/[formId]/page.js`
- Modify: `src/components/clients/ClientFormsTab.jsx`
- Modify: `src/components/care-delivery/forms-review.helpers.js`

- [ ] **Step 1: Write the failing test**

Extend `tests/forms-review.helpers.test.mjs`:

```js
assert.equal(canTransitionFormStatus('DRAFT', 'SUBMITTED', {}), true);
assert.equal(canTransitionFormStatus('APPROVED', 'REJECTED', { rejectionReason: 'x' }), false);
assert.deepEqual(getReviewableStatuses(), ['SUBMITTED', 'IN_REVIEW']);
```

- [ ] **Step 2: Run test to verify it fails in the integrated application state**

Run:

```bash
node tests/forms-review.helpers.test.mjs
```

Expected: the helper test may pass already, but the application state is still inconsistent because Prisma and current form surfaces still reference `PENDING` / `COMPLETED`. Use this step to confirm the helper’s target lifecycle before aligning the runtime code and schema.

- [ ] **Step 3: Write minimal implementation**

`prisma/schema.prisma`

```prisma
enum FormStatus {
  DRAFT
  SUBMITTED
  IN_REVIEW
  APPROVED
  REJECTED
}
```

`src/app/api/visits/[id]/forms/route.js`

```js
status: status || 'DRAFT',
```

`src/app/(dashboard)/care-delivery/forms/[formId]/page.js`

```js
// treat DRAFT as editable default state
// allow SUBMITTED forms to be read-only
```

`src/components/clients/ClientFormsTab.jsx`

```js
const STATUS_VARIANTS = {
  DRAFT: 'default',
  SUBMITTED: 'primary',
  IN_REVIEW: 'info',
  APPROVED: 'success',
  REJECTED: 'error',
};
```

- [ ] **Step 4: Run tests to verify it passes**

Run:

```bash
node tests/forms-review.helpers.test.mjs
```

Expected: PASS, with code now aligned to the same lifecycle the helper encodes

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/app/api/forms/[id]/route.js src/app/api/visits/[id]/forms/route.js src/app/(dashboard)/care-delivery/forms/[formId]/page.js src/components/clients/ClientFormsTab.jsx src/components/care-delivery/forms-review.helpers.js tests/forms-review.helpers.test.mjs
git commit -m "feat: align form status lifecycle"
```

---

### Task 1b: Harden Lifecycle Foundation

**Files:**
- Create: `prisma/migrations/20260415000000_align_form_status_lifecycle/migration.sql`
- Create: `src/lib/form-review.js`
- Modify: `src/app/api/forms/[id]/route.js`
- Modify: `src/app/api/visits/[id]/forms/route.js`
- Modify: `src/app/api/reports/compliance/route.js`
- Modify: `src/app/(dashboard)/care-delivery/forms/[formId]/page.js`
- Modify: `src/components/clients/ClientFormsTab.jsx`
- Modify: `tests/forms-review.helpers.test.mjs`

- [ ] **Step 1: Write the failing test**

Extend `tests/forms-review.helpers.test.mjs`:

```js
import {
  normalizeFormStatus,
  buildReviewMetadataPatch,
} from '../src/lib/form-review.js';

assert.equal(normalizeFormStatus('PENDING'), 'DRAFT');
assert.equal(normalizeFormStatus('COMPLETED'), 'SUBMITTED');
assert.equal(normalizeFormStatus('SUBMITTED'), 'SUBMITTED');

assert.deepEqual(
  buildReviewMetadataPatch({
    previousStatus: 'REJECTED',
    nextStatus: 'IN_REVIEW',
    rejectionReason: '',
    actorId: 'user-1',
  }),
  {
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectionReason: null,
  }
);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node tests/forms-review.helpers.test.mjs
```

Expected: FAIL because `src/lib/form-review.js` and the new exports do not exist yet

- [ ] **Step 3: Write minimal implementation**

`prisma/migrations/20260415000000_align_form_status_lifecycle/migration.sql`

```sql
ALTER TYPE "FormStatus" RENAME TO "FormStatus_old";

CREATE TYPE "FormStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED');

ALTER TABLE "client_form"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "FormStatus"
  USING (
    CASE
      WHEN "status"::text = 'PENDING' THEN 'DRAFT'::"FormStatus"
      WHEN "status"::text = 'COMPLETED' THEN 'SUBMITTED'::"FormStatus"
      ELSE "status"::text::"FormStatus"
    END
  ),
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';

DROP TYPE "FormStatus_old";
```

`src/lib/form-review.js`

```js
export function normalizeFormStatus(status) {
  if (status === 'PENDING') return 'DRAFT';
  if (status === 'COMPLETED') return 'SUBMITTED';
  return status || 'DRAFT';
}

export function buildReviewMetadataPatch({ previousStatus, nextStatus, rejectionReason, actorId }) {
  if (nextStatus === 'IN_REVIEW') {
    return {
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectionReason: null,
    };
  }

  if (nextStatus === 'APPROVED') {
    return {
      approvedAt: new Date(),
      approvedBy: actorId,
      rejectedAt: null,
      rejectionReason: null,
    };
  }

  if (nextStatus === 'REJECTED') {
    return {
      approvedAt: null,
      approvedBy: null,
      rejectedAt: new Date(),
      rejectionReason,
    };
  }

  return {};
}
```

Then update touched routes/pages/components to import `normalizeFormStatus` from `src/lib/form-review.js` instead of duplicating local normalization, normalize the existing-form return path in `src/app/api/visits/[id]/forms/route.js`, and update the compliance report to use `status: 'DRAFT'`.

- [ ] **Step 4: Run tests to verify it passes**

Run:

```bash
node tests/forms-review.helpers.test.mjs
```

Expected: PASS with the new normalization and metadata-patch coverage

- [ ] **Step 5: Commit**

```bash
git add prisma/migrations/20260415000000_align_form_status_lifecycle/migration.sql src/lib/form-review.js src/app/api/forms/[id]/route.js src/app/api/visits/[id]/forms/route.js src/app/api/reports/compliance/route.js src/app/(dashboard)/care-delivery/forms/[formId]/page.js src/components/clients/ClientFormsTab.jsx tests/forms-review.helpers.test.mjs
git commit -m "fix: harden form review lifecycle foundation"
```

---

### Task 1c: Finalize Lifecycle Foundation Semantics

**Files:**
- Create: `prisma/migrations/20260415010000_add_visit_template_form_uniqueness/migration.sql`
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/form-review.js`
- Modify: `src/components/care-delivery/forms-review.helpers.js`
- Modify: `src/app/(dashboard)/care-delivery/forms/[formId]/page.js`
- Modify: `src/app/api/visits/[id]/forms/route.js`
- Modify: `src/app/api/reports/client-history/[clientId]/route.js`
- Modify: `src/components/clients/ClientFormsTab.jsx`
- Modify: `tests/forms-review.helpers.test.mjs`
- Modify: `tests/edit-visit-forms.test.mjs`

- [ ] **Step 1: Write the failing test**

Extend `tests/forms-review.helpers.test.mjs`:

```js
import {
  shouldAutosaveDraft,
  countSubmittedLikeStatuses,
} from '../src/lib/form-review.js';

assert.equal(
  shouldAutosaveDraft({ status: 'DRAFT', hasValidationErrors: true }),
  true
);
assert.equal(
  shouldAutosaveDraft({ status: 'SUBMITTED', hasValidationErrors: false }),
  false
);
assert.equal(
  countSubmittedLikeStatuses(['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED']),
  3
);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node tests/forms-review.helpers.test.mjs
```

Expected: FAIL because the new helpers do not exist yet

- [ ] **Step 3: Write minimal implementation**

`prisma/migrations/20260415010000_add_visit_template_form_uniqueness/migration.sql`

```sql
CREATE UNIQUE INDEX IF NOT EXISTS "client_form_visitId_templateId_key"
ON "client_form" ("visitId", "templateId")
WHERE "visitId" IS NOT NULL;
```

`prisma/schema.prisma`

```prisma
@@unique([visitId, templateId], map: "client_form_visitId_templateId_key")
```

`src/lib/form-review.js`

```js
export function shouldAutosaveDraft({ status, hasValidationErrors }) {
  return normalizeFormStatus(status) === 'DRAFT';
}

export function countSubmittedLikeStatuses(statuses) {
  return statuses.filter((status) => ['SUBMITTED', 'IN_REVIEW', 'APPROVED'].includes(normalizeFormStatus(status))).length;
}
```

Then:
- make the form detail page autosave draft `formData` even with required-field validation errors, while still blocking submit until valid
- update visit-form creation to rely on the DB uniqueness invariant safely
- update client-history reporting to count `IN_REVIEW` alongside submitted/approved states and normalize statuses through `src/lib/form-review.js`
- move any shared lifecycle logic still living in `src/components/care-delivery/forms-review.helpers.js` into `src/lib/form-review.js`, leaving the component helper file focused only on queue presentation concerns
- update stale client-forms empty-state copy
- update the old `PENDING` fixture in `tests/edit-visit-forms.test.mjs`

- [ ] **Step 4: Run tests to verify it passes**

Run:

```bash
node tests/forms-review.helpers.test.mjs
node tests/edit-visit-forms.test.mjs
```

Expected: PASS for both scripts

- [ ] **Step 5: Commit**

```bash
git add prisma/migrations/20260415010000_add_visit_template_form_uniqueness/migration.sql prisma/schema.prisma src/lib/form-review.js src/components/care-delivery/forms-review.helpers.js src/app/(dashboard)/care-delivery/forms/[formId]/page.js src/app/api/visits/[id]/forms/route.js src/app/api/reports/client-history/[clientId]/route.js src/components/clients/ClientFormsTab.jsx tests/forms-review.helpers.test.mjs tests/edit-visit-forms.test.mjs
git commit -m "fix: finalize form review lifecycle foundation"
```

---

### Task 2: Add Review Queue API

**Files:**
- Create: `tests/forms-review-route.test.mjs`
- Create: `src/app/api/forms/review/route.js`
- Modify: `src/app/api/forms/[id]/route.js`
- Modify: `src/components/care-delivery/forms-review.helpers.js`

- [ ] **Step 1: Write the failing tests**

```js
import assert from 'node:assert/strict';
import { canTransitionFormStatus } from '../src/components/care-delivery/forms-review.helpers.js';

function run() {
  assert.equal(canTransitionFormStatus('SUBMITTED', 'APPROVED', {}), true);
  assert.equal(
    canTransitionFormStatus('IN_REVIEW', 'REJECTED', { rejectionReason: 'Missing initials' }),
    true
  );
  assert.equal(
    canTransitionFormStatus('IN_REVIEW', 'REJECTED', { rejectionReason: '' }),
    false
  );
}

run();
console.log('forms-review route tests passed');
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node tests/forms-review-route.test.mjs`
Expected: FAIL until helper/API transition rules are fully wired

- [ ] **Step 3: Write minimal implementation**

`src/app/api/forms/review/route.js`

```js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { buildReviewQueueFilters, getReviewableStatuses } from '@/components/care-delivery/forms-review.helpers';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const filters = buildReviewQueueFilters(Object.fromEntries(request.nextUrl.searchParams.entries()));
  const where = {
    organizationId: session.user.organizationId,
    ...(filters.status ? { status: filters.status } : { status: { in: getReviewableStatuses() } }),
    ...(filters.clientId ? { clientId: filters.clientId } : {}),
    ...(filters.templateId ? { templateId: filters.templateId } : {}),
    ...(filters.dateFrom || filters.dateTo
      ? {
          submittedAt: {
            ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
            ...(filters.dateTo ? { lte: new Date(`${filters.dateTo}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
  };

  const forms = await prisma.form.findMany({
    where,
    orderBy: [{ submittedAt: 'desc' }, { updatedAt: 'desc' }],
    include: {
      client: { select: { id: true, firstName: true, lastName: true } },
      template: { select: { id: true, name: true, category: true } },
      visit: { select: { id: true, title: true, startTime: true } },
    },
  });

  return NextResponse.json({ forms });
}
```

`src/app/api/forms/[id]/route.js`

```js
if (status && status !== existingForm.status) {
  if (!canTransitionFormStatus(existingForm.status, status, { rejectionReason })) {
    return NextResponse.json({ error: 'Invalid form status transition' }, { status: 400 });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node tests/forms-review.helpers.test.mjs`
Run: `node tests/forms-review-route.test.mjs`
Expected: PASS for both scripts

- [ ] **Step 5: Commit**

```bash
git add tests/forms-review-route.test.mjs src/app/api/forms/review/route.js src/app/api/forms/[id]/route.js src/components/care-delivery/forms-review.helpers.js
git commit -m "feat: add forms review queue api"
```

---

### Task 3: Add Central Forms Review Queue Page

**Files:**
- Create: `src/app/(dashboard)/care-delivery/forms/review/page.js`
- Create: `src/components/care-delivery/FormsReviewQueue.jsx`
- Modify: `src/components/care-delivery/CareDeliveryLayout.jsx`
- Modify: `src/components/care-delivery/forms-review.helpers.js`

- [ ] **Step 1: Write the failing test**

Extend `tests/forms-review.helpers.test.mjs` with queue-row formatting expectations:

```js
import { formatReviewQueueRow } from '../src/components/care-delivery/forms-review.helpers.js';

assert.deepEqual(
  formatReviewQueueRow({
    id: 'form-1',
    status: 'SUBMITTED',
    client: { firstName: 'Mia', lastName: 'Chen' },
    template: { name: 'Patient Logs' },
  }),
  {
    id: 'form-1',
    clientName: 'Mia Chen',
    templateName: 'Patient Logs',
    status: 'SUBMITTED',
  }
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/forms-review.helpers.test.mjs`
Expected: FAIL because `formatReviewQueueRow` does not exist yet

- [ ] **Step 3: Write minimal implementation**

`src/components/care-delivery/forms-review.helpers.js`

```js
export function formatReviewQueueRow(form) {
  return {
    id: form.id,
    clientName: `${form.client?.firstName || ''} ${form.client?.lastName || ''}`.trim(),
    templateName: form.template?.name || 'Untitled Form',
    status: form.status,
  };
}
```

`src/app/(dashboard)/care-delivery/forms/review/page.js`

```js
import FormsReviewQueue from '@/components/care-delivery/FormsReviewQueue';

export default function FormsReviewPage() {
  return <FormsReviewQueue />;
}
```

`src/components/care-delivery/FormsReviewQueue.jsx`

```js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatReviewQueueRow } from './forms-review.helpers';

export default function FormsReviewQueue() {
  const router = useRouter();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', clientId: '', templateId: '', dateFrom: '', dateTo: '' });

  useEffect(() => {
    async function fetchForms() {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/forms/review?${params}`);
      const data = await response.json();
      setForms((data.forms || []).map(formatReviewQueueRow));
      setLoading(false);
    }
    fetchForms();
  }, [filters]);

  // render filters + table + open action
}
```

`src/components/care-delivery/CareDeliveryLayout.jsx`

```js
{ id: 'forms-review', label: 'Forms Review', href: '/care-delivery/forms/review' }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/forms-review.helpers.test.mjs`
Expected: PASS with queue-row expectations included

- [ ] **Step 5: Commit**

```bash
git add src/app/'(dashboard)'/care-delivery/forms/review/page.js src/components/care-delivery/FormsReviewQueue.jsx src/components/care-delivery/forms-review.helpers.js src/components/care-delivery/CareDeliveryLayout.jsx tests/forms-review.helpers.test.mjs
git commit -m "feat: add care delivery forms review queue"
```

---

### Task 4: Strengthen Client-Level Form Verification

**Files:**
- Modify: `src/components/clients/ClientFormsTab.jsx`
- Modify: `src/app/api/clients/[id]/forms/route.js`
- Modify: `src/app/api/forms/[id]/route.js`

- [ ] **Step 1: Write the failing test**

Add lifecycle expectations to `tests/forms-review.helpers.test.mjs`:

```js
import { getFormStatusLabel } from '../src/components/care-delivery/forms-review.helpers.js';

assert.equal(getFormStatusLabel('IN_REVIEW'), 'In Review');
assert.equal(getFormStatusLabel('REJECTED'), 'Rejected');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/forms-review.helpers.test.mjs`
Expected: FAIL because `getFormStatusLabel` is missing

- [ ] **Step 3: Write minimal implementation**

`src/components/care-delivery/forms-review.helpers.js`

```js
export function getFormStatusLabel(status) {
  const labels = {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    IN_REVIEW: 'In Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  };
  return labels[status] || status;
}
```

`src/app/api/clients/[id]/forms/route.js`

```js
reviewedAt: form.approvedAt || form.reviewedAt || null,
reviewedByName: form.reviewedByName || null,
```

`src/components/clients/ClientFormsTab.jsx`

```js
// add columns / cells for status label, reviewed date, reviewer, rejection reason
// keep View Form action as the primary navigation action
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/forms-review.helpers.test.mjs`
Expected: PASS with status-label assertions included

- [ ] **Step 5: Commit**

```bash
git add src/components/clients/ClientFormsTab.jsx src/app/api/clients/[id]/forms/route.js src/app/api/forms/[id]/route.js src/components/care-delivery/forms-review.helpers.js tests/forms-review.helpers.test.mjs
git commit -m "feat: improve client form verification metadata"
```

---

### Task 5: Wire Review Actions Into Form Detail Page

**Files:**
- Modify: `src/app/(dashboard)/care-delivery/forms/[formId]/page.js`
- Modify: `src/app/api/forms/[id]/route.js`
- Modify: `src/components/care-delivery/forms-review.helpers.js`

- [ ] **Step 1: Write the failing test**

Extend `tests/forms-review.helpers.test.mjs`:

```js
import { buildReviewActionPayload } from '../src/components/care-delivery/forms-review.helpers.js';

assert.deepEqual(buildReviewActionPayload('APPROVED'), { status: 'APPROVED' });
assert.deepEqual(
  buildReviewActionPayload('REJECTED', 'Missing signature'),
  { status: 'REJECTED', rejectionReason: 'Missing signature' }
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/forms-review.helpers.test.mjs`
Expected: FAIL because `buildReviewActionPayload` is missing

- [ ] **Step 3: Write minimal implementation**

`src/components/care-delivery/forms-review.helpers.js`

```js
export function buildReviewActionPayload(status, rejectionReason = '') {
  const payload = { status };
  const normalizedReason = normalizeRejectionReason(rejectionReason);
  if (status === 'REJECTED') {
    payload.rejectionReason = normalizedReason;
  }
  return payload;
}
```

`src/app/(dashboard)/care-delivery/forms/[formId]/page.js`

```js
// add review actions when form.status is SUBMITTED or IN_REVIEW
// PATCH /api/forms/${formId} with buildReviewActionPayload(...)
// require prompt/input before reject
```

`src/app/api/forms/[id]/route.js`

```js
reviewedAt: ['APPROVED', 'REJECTED'].includes(status) ? new Date() : existingForm.reviewedAt,
approvedAt: status === 'APPROVED' ? new Date() : existingForm.approvedAt,
rejectionReason: status === 'REJECTED' ? normalizeRejectionReason(rejectionReason) : null,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/forms-review.helpers.test.mjs`
Expected: PASS with review-payload assertions included

- [ ] **Step 5: Commit**

```bash
git add src/app/'(dashboard)'/care-delivery/forms/[formId]/page.js src/app/api/forms/[id]/route.js src/components/care-delivery/forms-review.helpers.js tests/forms-review.helpers.test.mjs
git commit -m "feat: add review actions to form detail page"
```

---

### Task 6: Improve Medication Administration Event Selection

**Files:**
- Modify: `src/app/(dashboard)/care-delivery/medications/page.js`
- Modify: `src/app/api/medications/[id]/administer/route.js`
- Create: `tests/medication-administration.helpers.test.mjs`
- Modify: `src/components/care-delivery/forms-review.helpers.js`

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import { formatMedicationVisitOption } from '../src/components/care-delivery/forms-review.helpers.js';

function run() {
  assert.deepEqual(
    formatMedicationVisitOption({
      id: 'visit-1',
      title: 'Morning Visit',
      startTime: '2026-04-15T08:00:00.000Z',
      service: { name: 'Skilled Nursing' },
    }),
    {
      value: 'visit-1',
      label: 'Morning Visit',
      meta: 'Skilled Nursing',
    }
  );
}

run();
console.log('medication administration helper tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/medication-administration.helpers.test.mjs`
Expected: FAIL because helper does not exist

- [ ] **Step 3: Write minimal implementation**

`src/components/care-delivery/forms-review.helpers.js`

```js
export function formatMedicationVisitOption(visit) {
  return {
    value: visit.id,
    label: visit.title || 'Visit',
    meta: visit.service?.name || '',
  };
}
```

`src/app/(dashboard)/care-delivery/medications/page.js`

```js
// render visit options using formatMedicationVisitOption(...)
// show visit date/time + service in the select or helper text
// disable submit until a visit is selected when visit-context administration is required
```

`src/app/api/medications/[id]/administer/route.js`

```js
if (!visitId) {
  return NextResponse.json({ error: 'Visit selection is required for medication administration' }, { status: 400 });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/medication-administration.helpers.test.mjs`
Expected: PASS with `medication administration helper tests passed`

- [ ] **Step 5: Commit**

```bash
git add tests/medication-administration.helpers.test.mjs src/app/'(dashboard)'/care-delivery/medications/page.js src/app/api/medications/[id]/administer/route.js src/components/care-delivery/forms-review.helpers.js
git commit -m "feat: refine medication administration visit selection"
```

---

### Task 7: Expand Tutorial-Aligned Template Shapes

**Files:**
- Create: `tests/charting-template-shapes.test.mjs`
- Modify: `src/lib/charting-templates.js`
- Modify: `prisma/seed.js`

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import { chartingTemplates } from '../src/lib/charting-templates.js';

function run() {
  const rnTemplate = chartingTemplates.find((template) => template.name === 'RN/LPN Documentation (Georgia)');
  const patientLogs = chartingTemplates.find((template) => template.name === 'Patient Logs');

  assert.ok(rnTemplate);
  assert.ok(patientLogs);
  assert.ok(rnTemplate.schema.sections.length >= 3);
  assert.ok(patientLogs.schema.sections.length >= 2);
}

run();
console.log('charting template shapes tests passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/charting-template-shapes.test.mjs`
Expected: FAIL if the current template shapes are still too shallow

- [ ] **Step 3: Write minimal implementation**

`src/lib/charting-templates.js`

```js
{
  name: 'RN/LPN Documentation (Georgia)',
  isRequired: true,
  schema: {
    sections: [
      { id: 'visit-overview', title: 'Visit Overview', fields: [...] },
      { id: 'clinical-assessment', title: 'Clinical Assessment', fields: [...] },
      { id: 'interventions', title: 'Interventions', fields: [...] },
      { id: 'signoff', title: 'Sign Off', fields: [...] },
    ],
  },
}
```

`prisma/seed.js`

```js
// continue sourcing chartingTemplates from src/lib/charting-templates.js
// no duplicate inline template definitions
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/charting-template-shapes.test.mjs`
Run: `node tests/charting-templates.test.mjs`
Expected: PASS for both scripts

- [ ] **Step 5: Commit**

```bash
git add tests/charting-template-shapes.test.mjs tests/charting-templates.test.mjs src/lib/charting-templates.js prisma/seed.js
git commit -m "feat: expand tutorial-aligned charting templates"
```

---

### Task 8: Verification and Integration

**Files:**
- Verify touched files from Tasks 1-7

- [ ] **Step 1: Run focused tests**

Run:

```bash
node tests/forms-review.helpers.test.mjs
node tests/forms-review-route.test.mjs
node tests/medication-administration.helpers.test.mjs
node tests/charting-template-shapes.test.mjs
node tests/charting-templates.test.mjs
node tests/edit-visit-forms.test.mjs
```

Expected: all scripts print their success message and exit with code `0`

- [ ] **Step 2: Run targeted lint**

Run:

```bash
npx next lint --file src/app/(dashboard)/care-delivery/forms/review/page.js --file src/components/care-delivery/FormsReviewQueue.jsx --file src/components/care-delivery/forms-review.helpers.js --file src/components/clients/ClientFormsTab.jsx --file src/app/(dashboard)/care-delivery/forms/[formId]/page.js --file src/app/(dashboard)/care-delivery/medications/page.js --file src/app/api/forms/review/route.js --file src/app/api/forms/[id]/route.js --file src/app/api/medications/[id]/administer/route.js --file src/lib/charting-templates.js
```

Expected: `✔ No ESLint warnings or errors`

- [ ] **Step 3: Run full build**

Run:

```bash
npm run build
```

Expected:
- `Compiled successfully`
- no ESLint warnings
- `Generating static pages` completes

- [ ] **Step 4: Manual workflow verification**

Verify in the browser:

```text
1. Open a visit in Care Delivery
2. Create or open a required form
3. Submit the form
4. Open /care-delivery/forms/review and confirm the form appears
5. Start review and approve or reject it
6. Open the client profile Forms tab and confirm review metadata is visible
7. Open Care Delivery medications, select a client, choose a visit explicitly, and record an administration
8. Confirm medication history shows the linked visit context
```

Expected: all flows complete without console or UI errors

- [ ] **Step 5: Commit**

```bash
git add src tests
git commit -m "feat: complete care delivery forms operations workflow"
```

---

## Self-Review

### Spec Coverage

- Central review queue: covered in Tasks 2 and 3
- Client forms verification improvements: covered in Task 4
- Review actions on the existing form page: covered in Task 5
- Medication workflow fidelity: covered in Task 6
- Template fidelity: covered in Task 7
- Verification/build: covered in Task 8

### Placeholder Scan

The plan avoids `TODO`/`TBD` placeholders and gives exact file paths, commands, and implementation entry points for each task. UI-heavy tasks intentionally specify the route/component boundaries and the data/actions each surface must expose.

### Type Consistency

- Shared lifecycle statuses are consistently `DRAFT`, `SUBMITTED`, `IN_REVIEW`, `APPROVED`, `REJECTED`
- Helper function names are reused consistently across tasks
- The review queue API is consistently `GET /api/forms/review`
