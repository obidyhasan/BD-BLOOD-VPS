# Phase 2 Organization and Affiliation Backfill

Phase 2 normalizes legacy organization metadata, selects unambiguous canonical geographic organizations, builds parent links, and moves ordinary donor placement into `DonorOrganizationAffiliation` without deleting legacy membership rows.

## Safety model

- The command is a dry run unless `--apply` is provided.
- Dry run and apply both emit the same JSON review report.
- Apply is refused while any `BLOCKER` item remains.
- All writes run in one database transaction.
- Writes are idempotent: organizations are updated by ID and affiliations are upserted by donor ID.
- Legacy Normal Donor memberships remain in place for fallback reads and rollback.
- Governance records over capacity are reported but never deleted or silently deactivated.
- Upazila MANAGEMENT/Advisor records are reported for explicit remapping.

## Prerequisites

1. Complete the Phase 0/1 migration process documented in `docs/PHASE_0_1_MIGRATION.md`.
2. Take a database backup and prove restoration on a disposable environment.
3. Run the migration anomaly audit and resolve its blockers.
4. Rehearse this backfill against a sanitized production snapshot.
5. Confirm that `DATABASE_URL` targets the intended rehearsal or deployment database.

## Dry run

From `apps/api`:

```bash
npm run backfill:organizations > phase-2-backfill-report.json
```

Exit codes:

- `0`: dry run completed with no blockers; review items may still exist.
- `1`: command or database failure.
- `2`: one or more blockers require resolution.

Review these report codes:

- `CANONICAL_COLLISION`: multiple verified active organizations compete for one geographic scope. Admin must make the selection unambiguous before apply.
- `CENTRAL_ORGANIZATION_MISSING`: current Phase 1 schema still requires geographic columns, so Central creation remains a reviewed follow-up rather than an automatic fake-location insert.
- `DONOR_AFFILIATION_UNRESOLVED`: a donor Upazila has no unambiguous canonical organization.
- `UPAZILA_ADVISOR_REQUIRES_REMAP`: Upazila does not permit Advisor seats.
- `GOVERNANCE_CAP_EXCEEDED`: records exceed approved seat capacity and require manual decisions.

## Apply

After reviewing and archiving a blocker-free report:

```bash
npm run backfill:organizations:apply > phase-2-backfill-applied.json
```

The command:

1. Normalizes legacy organization `type` into `level`.
2. Clears legacy canonical flags before selecting unambiguous verified active candidates.
3. Sets geographic hierarchy parents where both child and parent are unambiguous.
4. Backfills affiliation from active Normal Donor memberships first.
5. Falls back to donor Upazila only when no Normal Donor affiliation source exists.
6. Maps EXECUTIVE to COMMITTEE and MANAGEMENT to ADVISOR, except reviewed Upazila Advisor cases.

## Application compatibility

Profile Upazila synchronization now dual-writes the new affiliation and the existing Normal Donor membership. Canonical Upazila organizations are preferred; the legacy organization type remains a temporary fallback.

Affiliation reads should use the new affiliation first and the legacy Normal Donor membership only as a rollout fallback. The shared resolver implements this ordering.

## Verification

After apply:

```bash
npm run audit:migration
npm run typecheck
npm test
```

Also verify with read-only database queries:

- At most one canonical organization exists per geographic scope.
- Every canonical Upazila organization has its canonical District parent where available.
- Every affiliation Upazila matches its organization Upazila.
- Every eligible donor is represented once in donor affiliations.
- No governance record was deleted by the backfill.

## Rollback boundary

Before later phases begin, Phase 2 can be rolled back operationally by disabling new affiliation reads and returning to legacy Normal Donor membership reads. Legacy rows are intentionally retained. Do not delete affiliation rows or reset organization metadata until the captured pre-apply report and backup have been reviewed; database restoration is the authoritative rollback for an incorrect bulk apply.
