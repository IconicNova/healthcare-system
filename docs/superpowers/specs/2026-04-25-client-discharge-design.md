# Client Discharge Design

## Goal

Discharged clients should be preserved in history but hidden from the default Clients table. Staff should be able to discharge a client from the Clients table or the client profile, and they should be able to switch to a discharged-only view from the Clients page.

## Behavior

- The default `/clients` table shows clients whose status is not `DISCHARGED`.
- A separate view control on `/clients` lets staff view discharged clients only.
- The table action currently labeled `Remove` is renamed to `Discharge`.
- Confirming discharge changes the client status to `DISCHARGED`; the client then disappears from the default table after refresh.
- The client profile header includes a `Discharge Client` action for clients who are not already discharged.
- Discharge remains a soft action. Visits, care plans, invoices, documents, forms, medications, and clinical history are retained.

## Architecture

- Add a small shared helper in `src/lib/client-list-filters.js` to build the Prisma `where` clause for client listing.
- Update `GET /api/clients` to use that helper so default filtering is enforced by the API, not only by the UI.
- Update `ClientList.jsx` to add an active/discharged view control and rename discharge UI copy.
- Update `ClientProfile.jsx` to add the profile-level discharge action.

## Testing

- Add a focused Node test for the listing filter helper.
- Verify the test fails before implementation, then passes after implementation.
- Run lint/build checks that are available in the project.

