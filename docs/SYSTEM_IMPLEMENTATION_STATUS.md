# System Implementation Final Status

This document maps the recommended implementation order and acceptance criteria from `plans/system-implementation-plan.md` to verified code, migration, UI, test, and operational evidence.

## Executive status

All non-destructive implementation work described by the plan is present and verified. The system now includes canonical request routing, delayed donor dispatch, atomic one-bag commitments, donation-derived fulfillment, hand-over completion, durable requester SMS, profile readiness, automatic donor affiliation, donation-specific post eligibility, canonical organization hierarchy, separate donor/governance interfaces, category-authoritative governance caps, safe public projections, public tracking, explicit donation rejection/reversal, donor withdrawal, database-backed public request idempotency, a dedicated worker process, and reconciliation/preflight commands.

The rollout is not eligible for destructive Phase 7 cleanup yet. The configured database still contains legacy records that the preflight and reconciliation commands correctly block. Real PostgreSQL concurrency tests also remain externally blocked because `TEST_DATABASE_URL` is not configured.

## Recommended implementation order matrix

| # | Plan item | Status | Evidence |
|---:|---|---|---|
| 1 | Test harness and anomaly audit | Implemented | Node test harness, database isolation guard, migration anomaly audit, Phase contracts, and plan-completion contracts exist. |
| 2 | Organization hierarchy, canonical constraints, donor affiliation schema | Implemented additively | Explicit levels, parent/canonical fields, partial constraints, and `DonorOrganizationAffiliation` exist. Destructive legacy-column cleanup is deferred. |
| 3 | Organization/affiliation backfill and affiliation-based matching | Implemented; data rollout blocked | Dry-run backfills exist and matching uses active affiliation. Configured data still has unresolved hierarchy/affiliation records. |
| 4 | Profile readiness, capabilities, and completion gate | Implemented | Server readiness/capability derivation and the non-dismissible frontend completion gate are active. |
| 5 | Expanded request/assignment states and command transitions | Implemented | Explicit command services, transition guards, status history, and legacy endpoint removal are active. |
| 6 | Canonical Upazila routing and delayed donor dispatch | Implemented | Public creation resolves one canonical Upazila organization and creates no donor assignments. Donor dispatch is restricted to processing. |
| 7 | Atomic one-bag acceptance and `DONOR_FOUND` | Implemented | Request row lock, one-bag database constraint, capacity aggregation, stale action expiry, and deterministic conflicts are active. |
| 8 | Hardened request-linked donation submission and scoped verification | Implemented | Assignment ownership/state/cardinality checks and organization-jurisdiction verification are active. |
| 9 | Verification-driven fulfillment, cooldown, achievements, and post eligibility | Implemented | Verification transaction updates assignment/request, donor cooldown, achievements, and one-donation/one-post eligibility. |
| 10 | Hand-over completion | Implemented | Explicit hand-over command requires fulfilled state and verified required bags. |
| 11 | Durable outbox worker and requester SMS | Implemented | Skip-locked outbox, retries/dead-letter behavior, idempotent event keys, full templates, and a separately deployable worker are active. |
| 12 | Organization/donor dashboards, notifications, tracking | Implemented | Command dashboards, stale-conflict UX, donation submission/verification, safe public tracking, hierarchy, and capability UI are present. |
| 13 | Split governance/donor UI and transactional category caps | Implemented for new writes | Affiliated donors use a separate endpoint/page. Governance category is explicit, independently capped, lock-scoped, and Upazila Advisor UI/backend is blocked. |
| 14 | Reconciliation and legacy cleanup | Reconciliation implemented; destructive cleanup blocked | Read-only reconciliation and Phase 7 preflight exist. Legacy data counts are non-zero, so destructive migration is intentionally not created/applied. |
| 15 | Concurrency, authorization, E2E, migration and rollback tests | Contract/unit coverage implemented; real DB proof externally blocked | Full source contracts pass. Disposable PostgreSQL tests are skipped because `TEST_DATABASE_URL` is absent. Browser E2E automation is not configured in this repository. |

## Acceptance criteria matrix

| Acceptance criterion | Status |
|---|---|
| Every public request resolves exactly one canonical Upazila organization | Implemented for new requests; legacy requests require backfill. |
| No actionable donor alert before processing | Implemented. Request creation does not dispatch donors, and the legacy notification sweeper is no longer started. |
| Concurrent acceptance cannot exceed required bags | Implemented by request row lock and database one-bag/cardinality constraints; disposable DB stress proof awaits `TEST_DATABASE_URL`. |
| Full commitment produces `DONOR_FOUND`, not `FULFILLED` | Implemented. |
| Only verified linked donations produce `FULFILLED` | Implemented. |
| Only authorized hand-over produces `COMPLETED` | Implemented. |
| Remaining donor actions are disabled at `DONOR_FOUND` | Implemented transactionally and handled in stale frontend views. |
| Fulfillment SMS is durable, idempotent, retryable and audited | Implemented through `MessageOutbox` and the dedicated worker. |
| Verification atomically updates cooldown, achievements, post eligibility, assignment and request | Implemented. |
| Donor affiliation is separate from governance seats | Implemented for authoritative reads/new behavior; legacy Normal Donor membership cleanup is data-blocked. |
| Governance caps match hierarchy under concurrency | Implemented with category lock scope and caps; real concurrent final-seat proof awaits disposable PostgreSQL. |
| Email, profile, phone and donation eligibility are separate capability dimensions | Implemented. |
| Public APIs use safe projections | Implemented. Public donor data excludes phone/email and public tracking excludes requester/donor identities. |
| Admin is a permission superset while organization management is scoped | Implemented in request, inventory, affiliation directory, and donation verification guards. |
| Migration reports account for legacy data without silent loss | Implemented through dry-run reports, preflight, reconciliation, and blocked exit codes. |

## Additional completed gaps

The final audit added requirements that were previously partial or missing:

- Canonical organization tree and strict by-Upazila APIs.
- Authenticated organization affiliation directory separate from governance members.
- Canonical hierarchy frontend with donor/governance counts.
- Organization-scoped donation listing and verification UI.
- Explicit donor assignment withdrawal and replacement transition.
- Explicit donation verify/reject commands and Admin-only reversal.
- Reversal recalculation of request, donor cooldown, achievements, assignment, and linked recap post.
- Database-backed public request idempotency with payload fingerprint and concurrent race recovery.
- Dedicated background worker and Docker Compose worker service.
- Read-only system reconciliation audit.
- Category-authoritative governance appointment and activation locks.

## Verification results

### Passed

- API production build.
- API TypeScript.
- All 50 executable API tests; one database test skipped.
- Web TypeScript.
- Full web lint with zero errors; 180 legacy warnings remain.
- Next.js production build through webpack, including 69 generated static pages.
- Prisma schema validation.
- Prisma migration deployment and status; configured database is schema-current.
- Git diff integrity check.

Turbopack production build exhausted native memory on this Windows machine. The webpack production builder completed successfully, proving source compilation, TypeScript, page-data collection, and static generation.

### Data gates still blocked

Phase 7 cleanup preflight against configured `neondb`:

- 3 active Normal Donor memberships without active affiliation.
- 1 active affiliation location mismatch.
- 13 legacy `PENDING` blood requests.
- 51 blood requests missing authoritative handler.
- 0 active governance memberships without organization.
- 0 legacy assignment status rows.
- 0 canonical organizations using legacy type values.

Reconciliation audit:

- 9 request status/assignment aggregate mismatches.
- 48 donor cooldown projection mismatches.
- 1 affiliation geography mismatch.
- 0 governance capacity violations.
- 0 achievement unlock mismatches.

Both commands intentionally exit with code 2 while drift exists.

## Required release steps outside source implementation

1. Configure `TEST_DATABASE_URL` to a disposable PostgreSQL database and run database/concurrency tests.
2. Resolve organization-backfill blockers and review items before applying organization/affiliation backfill.
3. Resolve authoritative request handler blockers, then apply request lifecycle backfill.
4. Apply profile readiness backfill after authoritative affiliations exist.
5. Reconcile the 48 cooldown and 9 request aggregate mismatches under reviewed repair procedures.
6. Repeat preflight and reconciliation until every count is zero.
7. Observe production parity before creating the destructive Phase 7 schema cleanup migration.
8. Configure production environment files and render/deploy the Docker Compose stack with the worker service.

No destructive data repair was performed automatically because current reports contain ambiguous records requiring review.
