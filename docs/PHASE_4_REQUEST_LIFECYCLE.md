# Phase 4 Request Lifecycle Backfill

Phase 4 normalizes legacy blood request and donor-assignment states to the approved lifecycle without cutting runtime services over to the new command model. Runtime behavior changes belong to Phase 5.

## Normalization policy

Request status is derived conservatively from evidence:

- Legacy `PENDING` becomes `SUBMITTED` unless organization notification, donor alert, or assignment evidence exists; with dispatch evidence it becomes `PROCESSING`.
- `PROCESSING` becomes `DONOR_FOUND` only when committed bag units meet required units.
- Legacy `FULFILLED` remains `FULFILLED` only when verified linked donation units meet required units.
- A legacy fulfilled request with sufficient commitments but insufficient verified donations becomes `DONOR_FOUND`.
- A legacy fulfilled request without sufficient commitments becomes `PROCESSING`.
- `CANCELLED`, `REJECTED`, and `COMPLETED` remain terminal.

Assignment normalization:

- `PENDING` becomes `NOTIFIED`.
- `REJECTED` becomes `DECLINED`.
- Existing modern statuses remain unchanged.
- Any assignment with a verified linked donation becomes `DONATED`.

Committed units count `ACCEPTED`, `DONATION_PENDING`, and `DONATED` assignment bag units. Fulfilled units count only verified linked donation assignment bag units.

## Handling organization precedence

`handledByOrganizationId` is resolved in this order:

1. Existing `handledByOrganizationId`
2. Existing request `organizationId`
3. Earliest active organization notification
4. Canonical Upazila organization

An unresolved handling organization is a blocker.

## Donation linking policy

An unlinked donation is auto-linked only when exactly one committed assignment matches:

- Same donor
- Same Division
- Same District
- Same Upazila
- Same normalized hospital name
- Assignment existed before the donation
- Donation occurred within 30 days after assignment

Multiple candidate assignments remain unresolved. Multiple donations resolving to one one-bag assignment are blockers. The command never guesses among ambiguous records.

## Historical messages

The backfill creates no SMS, email, in-app message, notification, or outbox event. Historical transitions are recorded only in request status history with reason `PHASE_4_LIFECYCLE_BACKFILL`.

The current outbox enum has no `SUPPRESSED` status. Omitting historical events is safer than creating sendable rows. If suppressed historical event records become operationally necessary, add an explicit enum state in a later additive migration first.

## Dry run

Complete Phases 1-3 and rehearse against a sanitized snapshot. From `apps/api`:

```bash
npm run backfill:requests > phase-4-request-report.json
```

Exit codes:

- `0`: dry run completed without blockers; review items may remain.
- `1`: command or database failure.
- `2`: blocker records prevent apply.

Review codes:

- `CANONICAL_UPAZILA_COLLISION`
- `HANDLING_ORGANIZATION_UNRESOLVED`
- `DONATION_LINK_UNRESOLVED`
- `ASSIGNMENT_LINK_COLLISION`

Archive the report and resolve all blockers before apply. Review-only donation rows remain unlinked by design.

## Apply

After a successful rehearsal, restorable backup, and reviewed blocker-free report:

```bash
npm run backfill:requests:apply > phase-4-request-applied.json
```

Apply executes in one database transaction and:

1. Links only unambiguous donations.
2. Normalizes assignment statuses and lifecycle timestamps.
3. Sets handling organizations.
4. Normalizes request statuses and evidence-derived timestamps.
5. Adds idempotent migration status-history entries.
6. Creates zero historical messages.

## Verification

```bash
npm run typecheck
npm test
npm run test:db
```

Verify with read-only database queries:

- No request is `FULFILLED` unless verified linked units meet required units.
- No request is `DONOR_FOUND` unless committed units meet required units.
- Every active request has `handledByOrganizationId`.
- Legacy assignment `PENDING` and `REJECTED` values are absent from migrated active rows.
- Each assignment has at most one linked donation.
- No outbox rows were created by Phase 4.
- Status-history entries use `PHASE_4_LIFECYCLE_BACKFILL` and contain no sensitive requester data.

## Rollback boundary

The authoritative rollback for bulk lifecycle changes is restoration from the pre-apply database backup. Do not reverse statuses with ordinary API endpoints because runtime services still implement legacy transition side effects until Phase 5. Preserve the dry-run and applied reports for reconciliation.
