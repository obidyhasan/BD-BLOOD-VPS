# BD Blood Codebase Optimization

## Executive Summary

This pass retained the existing monorepo architecture and focused on confirmed defects, dead code, query paths, cache safety, resource usage, dependency security, and maintainability. The repository was not reorganized simply to create a larger diff.

The resulting change set removes 22 verified-unreferenced files and seven unused frontend packages, consolidates one duplicated account invariant that existed in eight backend services, adds four query-aligned database indexes, bounds notification broadcast memory usage, and reduces frontend lint warnings from 142 to nine upstream compatibility notices. Both production applications build successfully and the dependency audit reports zero known vulnerabilities.

## Current Architecture Found

BD Blood is an npm-workspaces monorepo with two deployable applications:

- `apps/web`: Next.js App Router frontend, React 19, Redux Toolkit Query, server-side fetch services, tagged Next.js caching, Socket.IO client integration, and role-specific route groups.
- `apps/api`: Express API, Prisma/PostgreSQL, Redis-backed cache and OTP helpers, Socket.IO server, validation and domain services, seed/backfill/audit scripts, and a separately deployable background worker.
- `apps/api/prisma`: split Prisma schema, ordered migrations, and PostgreSQL data model.
- Root: workspace scripts, Docker/VPS configuration, deployment documentation, lockfile, and cross-application configuration.

The API is organized by domain modules with routes, controllers, validation, and services. Critical blood-request transitions already use command services, transactions, row locks, durable outbox events, and explicit transition rules. This is an appropriate architecture and was preserved.

## Final Architecture

The physical boundaries remain intentionally stable:

```text
BD-BLOOD/
|-- apps/
|   |-- api/
|   |   |-- prisma/{schema,migrations}
|   |   `-- src/{app,server.ts,worker.ts}
|   `-- web/
|       `-- src/{app,components,helper,hooks,lib,redux,services}
|-- docs/
|-- docker-compose*.yml
|-- package.json
`-- package-lock.json
```

Backend business rules remain in services/shared domain helpers, controllers remain transport-focused, Prisma access remains backend-only, and the web application does not import API internals. No new generic repository layer or shared dumping-ground package was introduced.

## Public Module

- Direct public reads continue to use server-rendered initial data with client fallback where interaction/refetching is useful.
- FAQ reads are now classified as public and participate in the existing `faqs` tag/TTL strategy.
- Location and blood-group reads now receive their existing cache tags, completing targeted server-fetch caching for these stable reference datasets.
- Public operational blood-request data retains a short TTL; private dashboards, notifications, and session data are not placed in shared Next.js caches.
- The restored details-header back link uses the existing route contract rather than retaining commented-out UI.

## Donor Module

- Donor-owned mutations and reads continue to resolve identity from the verified JWT payload, not client-supplied donor IDs.
- Active/deleted account enforcement is now centralized in `getActiveActorDonor` and shared by donation, post, blog, event, gallery, notification, report, and organization-member workflows.
- Donation history and latest verified donation queries now have composite indexes matching donor, deletion, verification, and date predicates.
- Existing profile readiness, request acceptance, donation, achievement, post, and notification contract tests remain green.

## Organization Module

- Existing authoritative organization access middleware and command-oriented blood-request workflows were preserved.
- Organization A/B isolation continues to be enforced by backend membership/handling-organization checks.
- Public and management content remain connected through approval state and tagged invalidation for posts, blogs, events, galleries, and organization data.
- Unused legacy organization cards/modals were removed only after import, route, and static-reference checks.

## Super Admin Module

- Admin management pages retain their current API-backed CRUD and approval flows.
- Dead imports and commented UI scaffolding were removed from positions, settings, medical, organization, reports, and moderation surfaces.
- Unstable derived arrays were memoized in admin list pages, eliminating hook dependency churn without changing API contracts.
- System-wide notification broadcast now processes recipients in cursor-paginated batches of 500 and returns only the count required by the frontend contract.

## Authentication

The most important correctness fix is method-aware server authentication. Previously, a broad public-prefix classification could make protected non-GET operations under otherwise public resources omit the access token and skip refresh handling. The server fetch helper now:

- treats private endpoint overrides as authenticated;
- treats non-GET operations as authenticated unless explicitly anonymous;
- allows only auth operations, public blood-request creation, and contact submission as anonymous mutations;
- refreshes expired access tokens only for requests that require authentication;
- keeps public GET responses independent of user-specific shared state.

Socket authentication now selects only donor `id`, `email`, and `accountStatus` rather than loading the full donor record.

## Backend/Data Layer

- Eight copies of the authenticated active-donor lookup were replaced by `apps/api/src/app/shared/actorDonor.ts`.
- Legacy in-process notification/SMS dispatch modules were removed after confirming the durable message outbox and separately deployed worker are authoritative.
- Unused scheduler exports were removed from job modules; scheduling has one owner in `worker.ts`, avoiding two subtly different scheduling paths.
- Prisma, PostgreSQL, Redis, Socket.IO, and worker deployment boundaries remain Docker/VPS compatible.
- Existing transactions, row locks, outbox idempotency, retry/backoff, and graceful worker timer cleanup were preserved.

## Files Removed

Twenty-two files were removed:

- 3 obsolete backend notification/SMS dispatcher modules.
- 2 unused donor notification presentation components.
- 5 unused organization/admin feature components.
- 12 unused generic/demo UI components.

Historical Prisma models and compatibility fields were not deleted: the existing Phase 7 preflight explicitly defers destructive schema cleanup until compatibility reads/writes and production data checks are complete.

## Duplicate Code Removed

- One account invariant was consolidated across eight services.
- Two unused duplicate job-scheduling entry points were removed; the deployable worker is the sole scheduler.
- Nonfunctional drag-and-drop setup in the generic data table was removed. The table now renders ordinary rows instead of initializing sensors and sortable state without a drag context.

## Major Refactors

- Notification broadcast changed from an unbounded all-donors array and equally large response to bounded cursor batches.
- The generic data table was reduced by removing unused drag state, sensors, sortable metadata, drawer controls, and a second icon system.
- Derived collection identities in 11 admin/management/medical components are stable across renders, eliminating 15 exhaustive-dependency warnings and avoidable recalculation.
- Public/private server-fetch authorization is now based on both endpoint and HTTP method.

## Query Optimizations

Confirmed query/resource improvements:

1. Notification broadcasts page donors by primary-key cursor and insert/emit at most 500 notifications per batch.
2. Socket authentication projects three required columns instead of an entire donor row.
3. Donor history and latest verified donation lookup paths are backed by predicate/order-aligned indexes.
4. Notification inbox and public post feed filters are backed by composite indexes.

No speculative repository abstraction or raw-SQL rewrite was added. Existing independent analytics queries already run concurrently or use grouped queries, and public/admin list endpoints already use pagination contracts.

## Database Index Improvements

Migration `20260817120000_query_path_indexes` adds four indexes:

- `bloodDonations(donorId, isDeleted, createdAt)`
- `bloodDonations(donorId, isDeleted, verificationStatus, donationDate)`
- `posts(approvalStatus, visibility, isDeleted, createdAt)`
- `notifications(donorId, isDeleted, isRead, createdAt)`

Equality/filter columns precede ordering columns. Existing single-column and domain-specific indexes were retained because they serve other query shapes.

## Next.js Caching Strategy

The existing approach remains the simplest appropriate split:

- Stable/public content: Next.js fetch caching with bounded TTLs and tags.
- Reference data: 24-hour location TTL, tagged location/blood-group reads, and backend Redis read-through caches.
- Frequently edited public content: shorter TTL plus mutation-driven tag invalidation.
- Urgent blood requests: short 60-second public cache plus invalidation.
- Private/session/notification/dashboard data: authenticated, `no-store`, and never globally shared-cached.

No additional cache layer was added to data already adequately handled by Next.js or RTK Query.

## Cache Tags / Invalidation

Existing mutation-to-tag connections were verified for posts, blogs, galleries, events, FAQs, policies, organizations, donors, blood requests, reports, medical institutions, doctors, medical information, and medical advertisements. This pass completed GET tag mapping for:

- `faqs`
- `location`
- `blood-groups`

Collection and entity tags remain targeted where entity identifiers are available.

## Redis Usage

Redis caching was improved, not expanded indiscriminately.

Existing justified uses remain:

- short-lived authentication read-through caching;
- public/platform analytics aggregation caching;
- stable blood-group and geographic reference caching;
- OTP state with a bounded in-memory fallback when Redis is unavailable.

The API already reuses a singleton Redis client and degrades to authoritative database/direct execution on cache failure. Graceful API shutdown now calls `quit()` on the Redis connection alongside Prisma disconnect. Operational request capacity, donor availability, and notification state were intentionally not added to Redis caching because stale distributed state would harm correctness.

## Frontend Performance Improvements

- Seven unused packages were removed: the three `@dnd-kit` packages, `@tabler/icons-react`, `react-aria-components`, `react-day-picker`, and `vaul`.
- Nineteen frontend files with no runtime/import/route consumers were removed.
- The generic table no longer initializes unused drag-and-drop runtime machinery.
- Stable memoized list identities prevent repeated filtering/sorting dependency churn.
- Existing public routes continue to use Next.js `Image`, responsive layouts, server initial data, and route-level static/dynamic rendering decisions.

No fabricated bundle-size percentage is reported; the concrete result is seven fewer installed direct frontend dependencies and successful generation of all 75 Next.js pages.

## Backend Performance Improvements

- Bounded broadcast memory and response size.
- Smaller Socket.IO authentication projection.
- Four hot-path composite indexes.
- Redis and Prisma graceful connection shutdown.
- One shared active-actor query rule instead of eight implementations that could diverge.
- One authoritative worker scheduler with durable outbox retry handling.

## Bundle/Image Improvements

The pass removed unused component libraries and a duplicate icon package. Existing image-heavy public modules already use Next.js image optimization; no blanket `priority` or eager loading was introduced. There was no evidence that replacing working image components or dynamically importing every interactive component would improve the current architecture enough to justify added complexity.

## Security Checks

- Fixed missing authentication on protected mutations sharing public endpoint prefixes.
- Preserved backend role, donor identity, organization scope, and moderation enforcement.
- Preserved private-response `no-store` behavior and prevented authenticated shared-cache leakage.
- Reduced the Socket.IO authentication projection.
- Upgraded Next.js from 16.1.3 to 16.3.1 and Nodemailer from 7.x to 9.0.5; the resolved NanoID version is 3.3.18.
- `npm audit` result: 0 known vulnerabilities (down from 5 high-severity findings during the initial audit).
- No secrets, authorization state, or operational request capacity were added to caches or logs.

## Tests / Build Results

| Check | Result |
|---|---|
| Prisma format | Pass |
| Prisma schema validation | Pass |
| Prisma client generation | Pass (7.9.1) |
| API TypeScript | Pass |
| Web TypeScript | Pass |
| Frontend lint | Pass with 9 warnings, 0 errors |
| API contract/unit tests | 90 pass, 0 fail, 1 skipped |
| Dependency audit | 0 vulnerabilities |
| API production build | Pass |
| Next.js production build | Pass, 75 pages generated |
| Git whitespace check | Pass after cleanup |

The skipped test is the disposable PostgreSQL integration test; it correctly requires `TEST_DATABASE_URL`, which was not configured in this environment. The migration is validated and generated but must still be applied to a target database through the normal deployment migration command.

The nine lint warnings are React Compiler compatibility notices for TanStack Table and React Hook Form APIs that intentionally return functions the compiler cannot memoize safely. ESLint reports zero unused-variable and zero exhaustive-dependency warnings.

## Final Cleanup Summary

| Measure | Confirmed count |
|---|---:|
| Files removed | 22 |
| Direct frontend dependencies removed | 7 |
| Unused scheduler exports removed | 2 |
| Duplicated active-donor implementations consolidated | 8 into 1 |
| Major query/resource paths optimized | 4 |
| Database indexes added | 4 |
| New public cache-tag mappings completed | 3 |
| Confirmed duplicate network requests removed | 0 claimed |
| Lint warnings reduced | 142 to 9 |
| Known dependency vulnerabilities reduced | 5 high to 0 |

## Deployment Notes

1. Apply the new Prisma migration with the existing deployment workflow (`npm run api:migrate:deploy`).
2. Deploy the API and worker as separate processes as documented; do not start legacy in-process schedulers.
3. Keep Redis optional but recommended for multi-instance OTP/cache behavior; the API continues to degrade safely when it is unavailable.
4. Configure `TEST_DATABASE_URL` in CI to execute the one skipped disposable-database integration test.
