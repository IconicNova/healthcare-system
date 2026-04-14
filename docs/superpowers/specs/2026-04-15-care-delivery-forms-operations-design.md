# Care Delivery Forms Operations Design

**Goal**

Complete the remaining partially implemented AlayaCare-inspired workflow depth while preserving the current HomeCare Pro UI structure. The focus is operational review of submitted forms, stronger client-level verification context, clearer medication administration flow, and tighter fidelity for the seeded charting templates.

**Context**

HomeCare Pro already supports:
- visit-centered form creation from the Care Delivery visit editor
- schema-driven charting forms with autosave and submit
- client-level forms visibility
- medication administration linked to visit context

The main remaining parity gaps are not about overall module structure anymore. They are about operational workflow depth after submission and about making the existing charting surfaces feel more complete and auditable.

## Scope

This design covers four upgrades:

1. Add a central forms review queue at `/care-delivery/forms/review`
2. Strengthen the client-level forms verification workflow
3. Improve medication administration workflow fidelity without changing the current page structure
4. Expand the tutorial-aligned charting templates so the key forms feel more complete and structured

This design does **not** attempt:
- pixel-perfect AlayaCare UI cloning
- a new top-level Care Management module
- broad unrelated refactors outside the touched forms and medication workflows

## Product Decisions

### Navigation

- Keep the current HomeCare Pro structure
- Add a new route at `/care-delivery/forms/review`
- Expose the review queue from the existing Care Delivery navigation
- Keep the current client profile `Forms` tab as the contextual record-level view

### Review Model

Use one shared lifecycle for forms:

- `DRAFT`
- `SUBMITTED`
- `IN_REVIEW`
- `APPROVED`
- `REJECTED`

Operational meaning:
- `DRAFT`: editable but not submitted
- `SUBMITTED`: awaiting reviewer action
- `IN_REVIEW`: reviewer has actively taken ownership
- `APPROVED`: accepted and complete
- `REJECTED`: sent back with a required reason

### UX Boundaries

- The central review queue is the operational inbox for staff/admins
- The client forms tab is the client-context companion view
- The existing form page remains the single charting/review surface opened from both places
- Medication administration remains on the existing Care Delivery medications page

## Architecture

### Shared Form Review Backend

The form lifecycle should be handled by one shared backend layer rather than separate client-tab and queue logic.

Responsibilities:
- query forms by organization, client, template, date, and status
- transition forms between review states
- record review metadata consistently
- prevent invalid transitions

The current forms APIs should be extended rather than replaced. The implementation should prefer updating the existing `forms/[id]` route and adding a dedicated review-queue listing route if the current client-scoped route would otherwise become overloaded.

Recommended backend split:
- `GET /api/forms/review` for cross-client queue listing and filters
- `PATCH /api/forms/[id]` for state transitions and review metadata updates
- existing client-scoped form routes continue to serve client-context tables

### Client Forms Context View

The client forms tab should become a thin consumer of the same lifecycle data used by the queue.

The tab should show:
- richer statuses
- submitted date
- reviewed date
- reviewer when available
- rejection reason when applicable
- a reliable `View Form` action

It should not duplicate all queue features. It should remain a contextual view, not a second inbox.

### Medication Administration Flow

The medications page should keep its current route and layout, but the administration modal should be more explicit about event context.

Improvements:
- make visit/event selection a first-class step in the modal
- show visit date/time and service label in the selection list
- validate that the selected visit belongs to the chosen client
- make the administration history clearly display visit linkage

This is a workflow-depth upgrade, not a page-architecture rewrite.

### Template Fidelity

The current schema-driven form engine is already the right foundation. The missing work is in the contents of the seeded forms, not in replacing the renderer.

The tutorial-aligned templates should be expanded in place so the main forms feel more complete:
- `RN/LPN Documentation (Georgia)`
- `Patient Logs`
- `Physician Order Form`

Improvements should focus on:
- clearer section structure
- more realistic field grouping
- more explicit review-relevant fields
- better consistency with the analyzed workflow

## Data Model

The design assumes the project already has or can safely use the following form fields without introducing a second review model:
- `status`
- `submittedAt`
- `approvedAt` or equivalent reviewed timestamp
- reviewer identity fields if already available
- `rejectionReason`

If reviewer identity is not currently persisted cleanly, add the minimum necessary fielding to store:
- reviewer user id
- reviewer display name if useful for denormalized UI rendering
- reviewed timestamp

Review queue filtering should be implemented directly in Prisma queries using organization-scoped filters. Do not fetch broad datasets and filter client-side.

## User Flows

### Review Queue Flow

1. Reviewer opens `/care-delivery/forms/review`
2. Queue defaults to reviewable items, especially `SUBMITTED` and `IN_REVIEW`
3. Reviewer filters by status, client, template, and date if needed
4. Reviewer starts review or opens a form directly
5. Reviewer approves or rejects from the form workflow
6. Queue and client tab both reflect updated status and metadata

### Client Verification Flow

1. User opens a client profile
2. User goes to `Forms`
3. User sees submitted/reviewed states with metadata
4. User opens the form
5. User can understand whether the form is pending, approved, or rejected and why

### Medication Administration Flow

1. User selects a client in Care Delivery medications
2. User opens medication administration
3. User chooses the relevant visit/event context explicitly
4. User records administration
5. History shows the administration linked to the selected visit

## Error Handling

### Form Review Actions

- Reject actions must require a reason
- Failed review actions must keep the current state visible
- UI should surface action-specific errors near the action, not silently fail
- Invalid transitions should be blocked server-side and surfaced clearly

Examples:
- trying to approve a `DRAFT` form should fail
- trying to reject without a reason should fail
- trying to review a form outside the organization should fail

### Queue Loading

- filter and fetch failures should preserve current filter values
- empty states should distinguish between “no forms match filters” and “failed to load forms”

### Medication Administration

- reject invalid client/visit combinations
- require a selected visit when the workflow is being recorded in visit context
- keep modal state intact on write failure

## Testing Strategy

Follow focused TDD-style coverage for helper logic and lifecycle rules before UI-heavy work where practical.

Tests should cover:
- queue filter/lifecycle helper logic
- valid and invalid form status transitions
- reject action requiring a reason
- medication visit-link validation helpers
- template section/field presence for the expanded tutorial-aligned forms

Verification after implementation:
- targeted tests for new helpers and lifecycle behavior
- targeted lint on touched files
- full `npm run build`
- manual browser pass through:
  - visit -> form -> submit
  - review queue -> approve or reject
  - client forms tab reflects review result
  - medication administration with explicit visit selection

## Files and Boundaries

Expected implementation areas:

- new route/page for the forms review queue under `src/app/(dashboard)/care-delivery/forms/review`
- care-delivery navigation updates
- forms queue UI component(s) under `src/components/care-delivery`
- existing form API extension under `src/app/api/forms`
- client forms tab enhancements in `src/components/clients/ClientFormsTab.jsx`
- medication workflow refinements in `src/app/(dashboard)/care-delivery/medications/page.js` and related API
- template updates in `src/lib/charting-templates.js` and `prisma/seed.js`

The review queue and client forms tab should share backend lifecycle logic but remain separate UI surfaces with distinct responsibilities.

## Non-Goals and Constraints

- Do not change the current top-level HomeCare Pro information architecture
- Do not introduce a new standalone Care Management module
- Do not rebuild the form renderer
- Do not pursue exact visual cloning of AlayaCare screens

## Success Criteria

This work is successful when:

- reviewers can process submitted forms from a central queue
- client-level forms show meaningful review status and metadata
- review actions are validated and auditable
- medication administration has clearer visit/event context
- the key tutorial-aligned templates feel materially more complete
- the app still builds cleanly and preserves current HomeCare Pro structure
