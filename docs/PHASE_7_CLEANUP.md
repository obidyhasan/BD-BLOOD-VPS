# Phase 7 Cleanup and Destructive-Cutover Gate

Phase 7 removes proven-dead compatibility surfaces and establishes a mandatory data preflight before destructive schema cleanup. This phase intentionally does not drop columns, enum values, memberships, or fallback reads while the configured database still contains unresolved migration data.

## Safe cleanup completed

The following compatibility surfaces were removed because the active Phase 6 frontend no longer uses them:

- `PATCH /blood-requests/:id/status`
- `POST /blood-requests/:id/cancel`
- `DELETE /blood-requests/:id`
- `POST /blood-requests/:id/rematch`
- The matching Redux Toolkit mutations and generated hooks
- The unreferenced arbitrary-status request table
- The deprecated rematch service implementation
- The status-patch validation schema

The supported request lifecycle writes are now explicit commands:

- `POST /blood-requests/:id/start-processing`
- `POST /blood-requests/:id/reject`
- `POST /blood-requests/:id/cancel-command`
- `POST /blood-requests/:id/assignments`
- `POST /blood-requests/:id/complete-handover`

Commitment-derived `DONOR_FOUND` and verified-donation-derived `FULFILLED` have no manual mutation endpoint.

## Destructive cleanup preflight

Run the read-only gate with:

```bash
cd apps/api
npm run preflight:phase7
```

The command reports `readyForDestructiveCleanup`, lists blocked capabilities, and exits with code 2 whenever any cleanup boundary is unsafe. It checks:

1. Active Normal Donor memberships without active affiliations.
2. Affiliation, donor, and canonical organization Upazila mismatches.
3. Active governance memberships without an organization.
4. Blood requests still using legacy `PENDING`.
5. Assignments still using legacy `PENDING` or `REJECTED`.
6. Active canonical organizations still carrying legacy `type` values.
7. Blood requests missing authoritative `handledByOrganizationId`.

Exit code 2 is an expected blocked result, not a script malfunction.

## Configured database result

Preflight executed on 2026-08-05 against the configured `neondb` database and correctly returned `readyForDestructiveCleanup: false`.

| Check | Count | Result |
|---|---:|---|
| Normal Donor memberships without active affiliation | 3 | Blocked |
| Active affiliation location mismatches | 1 | Blocked |
| Active governance memberships without organization | 0 | Pass |
| Legacy `PENDING` blood requests | 13 | Blocked |
| Legacy assignment statuses | 0 | Pass |
| Canonical organizations carrying legacy type | 0 | Pass |
| Requests missing authoritative handler | 51 | Blocked |

Blocked cleanup capabilities:

- Affiliation fallback removal
- Legacy request organization removal
- Legacy request status removal
- Normal Donor membership removal
- Organization legacy-field removal

No database changes were applied during this Phase 7 slice.

## Dry-run findings and required order

The existing migration commands were run without `--apply`.

### Organization and affiliation dry run

`npm run backfill:organizations` reported:

- 588 organizations scanned
- 547 canonical organizations planned
- 34 affiliations planned
- 9 governance mappings planned
- 19 blockers
- 52 review items

Review items include unresolved donor affiliations and Upazila management/advisor records that must be explicitly remapped or ended. Because blockers remain, do not run the apply command yet.

### Request lifecycle dry run

`npm run backfill:requests` reported:

- 51 requests scanned
- 22 request status changes planned
- 0 assignment status changes
- 22 blockers
- 65 review items

Many request blockers are unresolved handling organizations. Request backfill therefore depends on completing and verifying canonical organization setup first.

### Profile readiness dry run

`npm run backfill:profiles` reported:

- 92 donors scanned
- 4 complete
- 88 incomplete
- 69 review items

Missing affiliation is the dominant review reason. Profile status must remain incomplete for those donors until affiliation is authoritative.

## Required remediation sequence

1. Resolve the 19 organization hierarchy blockers and 52 review items.
2. Re-run the organization/affiliation dry run until blockers are zero.
3. Back up the database and rehearse `backfill:organizations:apply` against a sanitized snapshot.
4. Apply organization and affiliation backfill only after review approval.
5. Re-run the Phase 7 preflight.
6. Resolve request handler review items against canonical Upazila organizations.
7. Re-run request lifecycle dry run until blockers are zero.
8. Rehearse and then apply request lifecycle backfill.
9. Apply profile readiness backfill after authoritative affiliations exist.
10. Run reconciliation jobs and the Phase 7 preflight repeatedly during an observation window.
11. Create the destructive Prisma/SQL migration only when every preflight count is zero.

## Deferred destructive changes

The following plan items remain intentionally deferred:

- Remove Normal Donor organization memberships.
- Remove legacy affiliation fallback reads.
- Stop any remaining Normal Donor dual writes.
- Make governance `organizationId` required.
- Remove the global donor uniqueness constraint and install the final active-membership uniqueness policy.
- Remove free-form organization `type`.
- Make organization geography level-specific and nullable where required.
- Remove old blood-request and assignment enum values.
- Remove compatibility request organization fields and notification behavior only after parity checks.

Creating a destructive migration before the preflight passes would risk orphaned donors, inaccessible requests, invalid Central memberships, or irreversible status loss.

## Verification

Completed for this safe cleanup slice:

```bash
cd apps/api
npm test -- --test-name-pattern="request lifecycle writes|legacy organization rematch|legacy blood-request|frontend blood-request API|Phase 7 preflight|destructive schema cleanup"
npm run typecheck

cd apps/web
npm run typecheck
npm run lint -- "src/redux/features/bloodRequests/bloodRequestsApi.ts"
```

Results:

- Focused API contracts passed.
- API TypeScript passed.
- Web TypeScript passed.
- Focused web lint passed.
- Phase 7 preflight executed successfully as a safety gate and returned expected blocked exit code 2.
- Migration commands ran in dry-run mode only.

Disposable PostgreSQL concurrency tests still require `TEST_DATABASE_URL` before final production cleanup.

## Rollback boundary

Removed compatibility endpoints must not be restored as arbitrary mutation implementations. If an older frontend must temporarily run, deploy a reviewed adapter release that delegates only legal command transitions and still rejects derived states. Do not roll back the database to legacy statuses or delete status history, affiliations, or authoritative handling organization data.
