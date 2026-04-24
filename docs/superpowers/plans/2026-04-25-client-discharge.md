# Client Discharge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide discharged clients from the default Clients table, expose a discharged-only view, and add discharge actions in the table and client profile.

**Architecture:** Put the default/non-discharged query behavior in a shared helper used by the clients API. Keep UI changes scoped to `ClientList.jsx` and `ClientProfile.jsx`, using the existing soft-discharge endpoint.

**Tech Stack:** Next.js 14 App Router, React, Prisma, Node built-in test runner.

---

### Task 1: API Filter Helper

**Files:**
- Create: `src/lib/client-list-filters.js`
- Test: `tests/client-list-filters.test.mjs`
- Modify: `src/app/api/clients/route.js`

- [ ] Write a failing test that imports `buildClientListWhere` and asserts default results exclude `DISCHARGED`, explicit `DISCHARGED` returns only discharged clients, and search terms are preserved.
- [ ] Run `node --test tests/client-list-filters.test.mjs` and confirm it fails because the helper does not exist.
- [ ] Implement `buildClientListWhere({ organizationId, search, status })` with valid statuses `ACTIVE`, `INACTIVE`, `PENDING`, `ON_HOLD`, and `DISCHARGED`.
- [ ] Update `GET /api/clients` to call the helper instead of inlining `where` construction.
- [ ] Re-run `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/client-list-filters.test.mjs` and confirm it passes.

### Task 2: Clients Table Discharge View

**Files:**
- Modify: `src/components/clients/ClientList.jsx`

- [ ] Add a `clientView` state with `active` as the default and `discharged` as the alternate.
- [ ] When `clientView` is `discharged`, request `status=DISCHARGED`; otherwise use the selected status filter and rely on the API default to exclude discharged clients.
- [ ] Rename `Remove` UI labels and modal copy to `Discharge`.
- [ ] Remove hard-delete wording from the modal because the endpoint preserves history.
- [ ] Refresh the table after discharge so the row disappears from the active view.

### Task 3: Client Profile Discharge Action

**Files:**
- Modify: `src/components/clients/ClientProfile.jsx`

- [ ] Add discharge modal state and a handler that calls `DELETE /api/clients/:id`.
- [ ] Show `Discharge Client` in the profile header only when `client.status !== 'DISCHARGED'`.
- [ ] After discharge succeeds, refresh the profile data and close the modal.
- [ ] Keep the existing `Edit Client` action unchanged.

### Task 4: Verification

**Files:**
- No new production files.

- [ ] Run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` after code edits as required by `AGENTS.md`.
- [ ] Run the focused Node test.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build` if lint succeeds or if lint is unavailable.
