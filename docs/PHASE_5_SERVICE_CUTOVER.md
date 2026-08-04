# Phase 5 Service and API Cutover

Phase 5 moves live blood request behavior from arbitrary status mutation to command-oriented transitions, canonical routing, row-locked donor commitments, donation-derived fulfillment, and durable SMS delivery.

## Deployment prerequisites

Do not deploy this cutover until:

1. Phase 1 schema migration is deployed.
2. Phase 2 canonical organization and affiliation backfill has been applied and verified.
3. Phase 3 profile readiness backfill has been applied.
4. Phase 4 request lifecycle backfill has been applied with no blockers.
5. A restorable database backup and disposable PostgreSQL rehearsal exist.

New public requests fail with `ORGANIZATION_NOT_CONFIGURED` when their Upazila lacks an explicit canonical organization. The legacy organization-type fallback is not used for new request routing.

## Public request submission

`POST /blood-requests` now:

- Validates Division-District-Upazila ancestry.
- Ignores client organization selection and resolves the canonical Upazila organization.
- Creates the request as `SUBMITTED`.
- Sets both compatibility `organizationId` and authoritative `handledByOrganizationId`.
- Creates initial status history.
- Creates one organization notification record.
- Creates a durable organization acknowledgement notification record.
- Does not alert donors or directly call an SMS provider.

## Request commands

Authenticated Admin or an authorized organization manager can call:

- `POST /blood-requests/:id/start-processing`
- `POST /blood-requests/:id/reject` with `{ "reason": "..." }`
- `POST /blood-requests/:id/cancel-command` with `{ "reason": "..." }`
- `POST /blood-requests/:id/assignments` to dispatch eligible donors after processing starts
- `POST /blood-requests/:id/complete-handover`

The existing `PATCH /blood-requests/:id/status` remains temporarily as a compatibility adapter. It delegates legal processing, rejection, cancellation, and completion commands. It rejects manual `DONOR_FOUND` and `FULFILLED` updates because those states are derived from commitments and verified donations.

## Donor commitments

Existing accept/reject routes now use command semantics:

- `PATCH /blood-requests/assignments/:assignmentId/accept`
- `PATCH /blood-requests/assignments/:assignmentId/reject`

Acceptance requires verified email, COMPLETE profile, active account, current availability, and no active donation cooldown. The service locks the request row before counting committed bag units. Exactly the required number can accept; when capacity is reached, the request becomes `DONOR_FOUND` and remaining `NOTIFIED` assignments become `EXPIRED` in the same transaction.

Declining remains available even when the donor is temporarily ineligible to accept.

Stable `409` conflict codes include:

- `PROFILE_INCOMPLETE`
- `EMAIL_NOT_VERIFIED`
- `DONOR_NOT_ELIGIBLE`
- `ASSIGNMENT_NOT_ACTIONABLE`
- `REQUEST_CAPACITY_REACHED`
- `REQUEST_CLOSED`
- `INVALID_REQUEST_TRANSITION`
- `HANDOVER_NOT_READY`

## Donation progression

For a request-linked donation, `POST /blood-donations` accepts `requestAssignmentId`, donation date, and optional recipient/notes. Hospital, organization, and geographic fields are derived from the accepted assignment and request. Creation moves the assignment to `DONATION_PENDING` atomically.

`PATCH /blood-donations/:id/verify` is available to Admin and authorized managers of the handling organization. Verification:

1. Locks request and donation rows.
2. Is idempotent for an already verified donation.
3. Updates donor cooldown and achievements once.
4. Moves the assignment to `DONATED`.
5. Counts verified linked bag units.
6. Moves the request to `FULFILLED` only when verified units meet required units.
7. Creates status history and an idempotent requester SMS outbox event.

Rejected evidence returns the assignment to `ACCEPTED`. Verified donations cannot be modified or deleted through ordinary endpoints; a dedicated reversal workflow is required.

## Durable outbox

The server starts a bounded SMS outbox worker. It:

- Claims rows with `FOR UPDATE SKIP LOCKED`.
- Processes only SMS events with supported templates.
- Prevents overlapping sweeps in one process.
- Retries with exponential backoff.
- Moves exhausted events to `DEAD` after five attempts.
- Uses unique event keys to prevent duplicate logical events.

Organization acknowledgement remains in the existing notification table. Unsupported in-app events are not written to the SMS outbox.

## Governance capacity concurrency

Organization membership activation and assignment now take a PostgreSQL transaction advisory lock keyed by organization and position level. Capacity is recounted and the membership write occurs under the same lock, preventing two concurrent requests from claiming the final seat.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run test:db
```

Concurrency behavior must be validated against a real disposable PostgreSQL database before production:

- Twenty simultaneous accepts for a three-bag request yield exactly three commitments.
- Two final-seat governance appointments yield one success and one conflict.
- Duplicate donation verification creates one fulfillment history entry and one SMS outbox event.
- Provider failure leaves a retryable outbox row without reverting fulfillment.

## Rollback boundary

Phase 5 changes live write behavior. Rollback requires deploying the prior service version together with database compatibility checks; do not reverse request or donation states through ordinary endpoints. The additive schema remains backward-compatible, but requests created after cutover use modern statuses and canonical handling organization fields. Preserve status history and outbox rows during rollback for reconciliation.
