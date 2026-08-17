# BD Blood Master Audit

Audit date: 2026-08-14 (Asia/Dhaka)

## Project overview

BD Blood is an npm-workspaces monorepo with a Next.js 16/React 19 web application and an Express 5/Prisma 7/PostgreSQL API. Redis supports OTP/cache behavior, Socket.IO delivers live in-app notification hints, a dedicated worker processes the durable SMS outbox and donor cooldown restoration, and Docker Compose deploys PostgreSQL, Redis, API, worker, web, and Nginx.

The review covered 665 repository files, all API route modules, the Prisma schema and migration, all seed/backfill/reconciliation scripts, authentication and authorization middleware, core domain services, web routes/services/state, tests, and deployment documentation. Important workflows were traced from UI to API validation, authorization, service logic, database access, response projection, and UI consumption. Existing status documents were treated as claims and rechecked against code and the configured database.

## Verification baseline before implementation

| Check | Result |
|---|---|
| API + web TypeScript | Pass |
| Prisma schema validation | Pass |
| Prisma migration status | Pass; one consolidated migration, database current |
| Web lint | Pass with 179 warnings and no errors |
| API tests | 62 pass, 7 fail, 1 skipped |
| Test failure cause | Seven tests reference three migration directories removed when migration history was consolidated |
| Real database/concurrency test | Skipped because `TEST_DATABASE_URL` is not configured |
| Migration anomaly audit | Pass; zero blockers and warnings |
| Phase 7 preflight | Pass; all legacy-data gates are zero |
| Reconciliation audit | Pass; all five projections are consistent |
| Configured database contents | Empty: 0 admins, donors, divisions, districts, Upazilas, organizations, requests, and memberships |
| Geographic source data | 8 divisions, 64 districts, and 495 distinct Upazila records in the corrected project seed |

The geographic list is deterministic but derives from an older third-party dataset. The current Bangladesh National Portal remains the authority for future reconciliation: <https://bangladesh.gov.bd/views/upazila-list/Upazilla-List/>. The implementation must report counts from data rather than hardcode a national total.

## Architecture and real business workflow

- Public users submit an idempotent blood request with a valid Division/District/Upazila ancestry. The API routes it to the canonical Upazila organization and enqueues an organization SMS.
- An authorized organization manager or Admin starts processing and dispatches eligible affiliated donors. Donors receive database-backed assignments and in-app notifications.
- Acceptance is row-locked and one bag per donor. Full commitments move the request to `DONOR_FOUND`; verified linked donations move it to `FULFILLED`; authorized hand-over moves it to `COMPLETED`.
- Donor location changes validate ancestry, resolve the canonical Upazila organization, update the donor affiliation, and recompute readiness/capabilities.
- Governance membership is conceptually separate from donor affiliation. Committee/advisor capacity is transactionally serialized, but the schema still contains legacy global membership cardinality and nullable national membership support.
- Admin access is represented by `Role.ADMIN`; organization management is granted to active Executive/Management governance members and scoped server-side.

## Role matrix

| Capability | Admin | Organization Executive/Management | Donor |
|---|---:|---:|---:|
| Platform users/content/geography control | Yes | No | No |
| National/Division/District governance | Yes | No | No |
| Own Upazila organization management | Yes | Yes, scoped | No |
| Blood-request processing/assignment | Yes | Yes, handled organization only | Assignment response only |
| Donation verification | Yes | Yes, jurisdiction scoped | Submit/view own evidence |
| Donor profile and preferences | Own/administrative | Own | Own |
| Public content and organization browsing | Yes | Yes | Yes |

## Requirement classification

Legend: ✅ correct, ⚠️ partial, ❌ missing, 🐛 broken, 🔐 security, 🗄️ integrity, ⚡ architecture/performance.

| Requirement | Status | Verified finding |
|---|---|---|
| Monorepo/API/web architecture | ✅ | Connected Next.js and Express applications with a single Prisma database layer. |
| Bangladesh geography seed | ⚠️🗄️ | At audit time the source contained 494 rows, including two duplicate Natore identities; finalization corrected it to 495 distinct Upazilas and removed count-only skipping. |
| Upazila to canonical organization | ✅/⚠️ | Canonical seed and strict request resolution exist; duplicate non-canonical registration paths and absent database scope constraints remain. |
| Organization/Committee terminology | ✅ | One organization/governance system; no parallel committee model. |
| Root membership | ⚠️🗄️ | Public national members exist logically, but new national writes use `organizationId: null` instead of the canonical Central organization and Central advisors are allowed. |
| Division members/advisors | ✅ | Backend relational scope and UI tabs are connected, capped at 11 per category. |
| District members/advisors | ✅ | Parent-scoped canonical organizations and relational member queries exist. |
| Upazila organization committee | ✅/⚠️ | Committee cap and no-advisor rule exist; global `donorId` uniqueness prevents multi-level governance despite prior design docs claiming otherwise. |
| Public organization navigation | ⚠️🐛 | Upazila redirect and hierarchy API work, but Division/District selection is component-only state and cannot be refreshed/deep-linked. Root advisor UI conflicts with the master rule. |
| Donor registration/profile/readiness | ✅/🔐 | Readiness, affiliation, eligibility and privacy-safe public projections work. `GET /user/:email` allows any authenticated donor to read another active donor's non-public fields. |
| Blood-request creation/routing | ✅ | Validates ancestry, requires idempotency key, routes canonically, rate limits, and avoids early donor dispatch. |
| Request assignment/concurrency | ✅ | Row locking, one-bag service semantics, legal transitions, withdrawal and stale action handling exist. |
| Donation verification/fulfillment | ✅ | Linked evidence, scoped verification, cooldown, achievements and request aggregation are transactional. |
| Request expiration | ❌ | Assignment expiry exists, but no confirmed business duration or request-level expiry model exists; implementation requires a product rule. |
| Super Admin seed | ❌ | Secure one-time bootstrap exists, but no deterministic/environment-driven seed and the configured database has zero Admin accounts. |
| Admin dashboard | ✅/⚠️ | Broad modules use real APIs. Some UI is warning-heavy and some public/admin organization reads share an over-broad endpoint. |
| Organization dashboard isolation | ✅ | Request, inventory, donation, appointment, gallery and analytics services recheck organization authority server-side. |
| Authentication | 🔐⚠️ | Password hashing, OTPs, secure cookies, status checks and refresh flow exist. Role authorization checks the JWT role before comparing the live database role; access tokens are also returned and stored in `localStorage`. No token-version/revocation model exists. |
| Database integrity | 🗄️⚠️ | Relations/indexes are extensive, but canonical organization uniqueness, geographic ancestry, positive bag checks, and level-specific geography are not database-enforced. Organization geography is scalar rather than relational. |
| Redis/Socket.IO/background | ✅/⚠️ | Dedicated worker and graceful shutdown exist. Socket auth depends on a browser-readable token; legacy unused sweepers remain. |
| API validation | ⚠️ | Most writes use Zod. Policy writes/filters do not, organization creation lacks ancestry enforcement, and several query parameters are cast directly. |
| Frontend correctness | ⚠️ | Core workflows are connected with loading/error/empty handling. Geographic query state, duplicate auth state, and 179 warnings remain. |
| Performance | ✅/⚡ | Pagination, batching, indexes, caching and outbox batching are present. Some large unpaginated management queries and broad includes remain. |
| Tests | 🐛⚠️ | Domain/contract coverage is meaningful, but seven stale migration-path tests fail and real PostgreSQL concurrency coverage is externally blocked. |
| Deployment | ✅/⚠️ | VPS/Docker topology matches persistent sockets/workers. Environment credentials, seed phone/admin values, SMTP/SMS/OAuth/Cloudinary and TLS URL settings remain deployment inputs. |

## Discovered feature audit

| Feature | Classification |
|---|---|
| Blogs, posts, comments, likes, work feed | Complete; moderated and privacy-projected |
| Gallery/homepage gallery | Complete; organization ownership enforced |
| Events and participation | Complete; Admin-authored, donor participation |
| Appointments | Complete; owner/organization/Admin authorization |
| Blood inventory | Complete; scoped writes and public reads |
| Notifications and broadcasts | Complete; user ownership enforced |
| Achievements | Complete; verification-derived |
| Medical institutions/doctors/articles/ads | Complete; public read and Admin management |
| Policies | Partial; CRUD works but validation is missing |
| Reports and contact messages | Complete; contact relies only on global rate limiting |
| Analytics | Complete; platform and organization scope separated |
| Google OAuth, email OTP, phone OTP, password reset | Complete; require external configuration |
| SMS, SMTP, Cloudinary, Redis | Require external production credentials |

## Confirmed implementation priorities

### P0 Critical

1. Enforce authorization from the live database role and remove browser-readable access-token persistence.
2. Add migration-safe database constraints for canonical organization scope, geography ancestry/level semantics, positive request/assignment units, and governance integrity.
3. Make canonical geography and a Super Admin reliably seedable and verifiable without mixing demo users into production data.

### P1 High

1. Normalize national governance onto the canonical Central organization and prohibit Root/Upazila advisors.
2. Prevent duplicate or geographically invalid organization creation/registration.
3. Close the authenticated donor email lookup privacy issue.
4. Repair the seven stale migration tests and update status documentation.
5. Make public geographic selection refreshable/deep-linkable.

### P2 Medium

1. Add missing Policy validation and harden query parsing.
2. Separate public verified/canonical organization reads from Admin management reads.
3. Remove obsolete fallback/sweeper code once schema cleanup is complete.
4. Reduce actionable lint warnings and unbounded management queries.

### P3 Low / external

1. Configure disposable PostgreSQL for true race tests and browser E2E tooling.
2. Reconcile the seed transliterations/source periodically against the Bangladesh National Portal.
3. Define request-level expiration duration and policy before adding an automatic expiry transition.

## Data integrity and deployment notes

The configured database is empty and all destructive-cleanup preflight gates pass. This makes a forward migration safe to develop, but production deployment must still run backup, `prisma migrate deploy`, deterministic seeds, and post-seed verification in that order. No credentials or demo committee users belong in source-controlled production seed data.
