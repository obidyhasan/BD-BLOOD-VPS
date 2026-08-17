# BD Blood Master Audit

Initial audit date: 2026-08-14 (Asia/Dhaka)

This report is based on two read-only passes through the repository, including route-to-service-to-database traces, frontend consumer checks, schema and migration inspection, the existing test suite, deployment files, and production-safe database audits. It supersedes the older `BD_BILAR_*` reports where the new requirements differ.

## Architecture Found

- npm-workspaces monorepo with `apps/web` (Next.js 16, React 19, Redux Toolkit Query) and `apps/api` (Express 5, Prisma 7, PostgreSQL).
- Cookie-based JWT authentication with live database role/account checks, server-mediated refresh, Zod validation, scoped rate limiting, and Cloudinary image uploads.
- Canonical `CENTRAL -> DIVISION -> DISTRICT -> UPAZILA` organization hierarchy with donor affiliations separated from governance memberships.
- Explicit blood-request command lifecycle backed by row locks, assignments, verified donations, status history, and a durable message outbox.
- Redis-backed OTP/cache support, authenticated Socket.IO donor rooms, and a dedicated background worker for SMS outbox and donor cooldown processing.
- VPS-oriented Docker Compose deployment with persistent API, worker, PostgreSQL, Redis, Next.js, Nginx, and TLS support.

## Existing Functional Modules

Authentication, users/donors, geography, organizations, governance positions and membership, blood requests, assignments, donations, donor posts, achievements, notifications, analytics, blogs, events, galleries, medical institutions, doctors, medical library information, advertisements, FAQ, policy, reports, contacts, inventory, Socket.IO, Redis, Cloudinary, email, SMS, seeds, migrations, reconciliation, and deployment are present.

## Requirement Classification

| Area / prompt sections | Classification | Verified implementation state |
|---|---|---|
| Architecture/review discipline (1-4) | ✅ | Existing architecture is substantial and was traced twice before edits. Committee and Organization share one membership model. |
| Geography and canonical organizations (5) | ✅ | 8 divisions, 64 districts, 495 Upazilas and 568 canonical hierarchy rows; deterministic transactional seed and partial unique indexes enforce one active Upazila organization. |
| Root members (6) | ✅ | Central committee has an 11-seat cap and reserves one seat for the Admin; homepage uses the same records. |
| Root advisors (6, 20-21) | 🐛 P1 | Service explicitly rejects Central advisors, public query returns an empty root advisor list, and the UI hides the root Advisor tab. This conflicts with the new requirement for 11 root advisors. |
| Division/district governance (7) | ✅ | Canonical-scope resolution, category caps, unique seat keys, Admin-only assignment, and server-side public filters exist. |
| Upazila committee (8, 26) | ✅ | Upazila committee is capped and authoritative for public display/dashboard authorization. Advisors are not granted access. |
| Public navigation (9) | ✅ | Required Home, Organization, Medical, Blog, Event and Gallery routes are present and responsive navigation is shared. |
| Need Blood redirect (10) | ✅ | Cascading API-backed selectors resolve the canonical Upazila organization and redirect to its public profile. |
| Blood request, dispatch and acceptance (11) | ✅ | Canonical organization routing, authoritative handler scope, eligible donor matching, assignment row locking, and capacity checks are implemented server-side. |
| Completion SMS (12) | ✅ | Fulfillment is derived from verified linked donations and enqueues one unique outbox event per request/recipient. |
| Success History and donor posts (13-14, 25, 41) | ✅ | Homepage limits approved public posts; donation posts require one verified donation through a unique `donationId`, enter pending moderation, and public reads are scoped/approved. |
| Medical ads, Who's Behind, FAQ, gallery content (15-18) | ✅ | Homepage uses managed database content and authoritative root committee membership; public visibility filters exist. |
| Internal hierarchy visualization (19) | ❌ P1 | Public Organization page still renders `Canonical Organization Hierarchy`; requirement says remove it from public UI. |
| Organization tabs/filtering (20-21) | ⚠️ P1 | Committee and regional advisor lookup work with URL state. Root advisors are hidden/blocked, preventing the required default root advisor view. |
| Organization public profile (22) | ⚠️ P1 | Identity, request form, posts, gallery and members are scoped. Statistics are incomplete and inventory uses the wrong read path. |
| Booking Donation (23) | ❌ P1 | Obsolete appointment model, API, Redux/services, public dialog, dashboard pages and navigation remain connected. Configured DB currently has zero live appointments. |
| Organization inventory (24) | 🐛 P1 | Platform inventory is donor-derived, but the public organization endpoint returns manually maintained inventory rows instead of eight active-donor counts. |
| Medical public page (27) | ⚠️ P1 | Three tabs and search exist; Division/District selectors exist, but Upazila state is not wired and Doctor/Library geography is not consistently filtered server-side. |
| Medical management (28) | 🔐 🗄️ P1 | Admin CRUD exists, but create/update do not validate Division/District/Upazila ancestry and schema lacks geographic foreign-key relations. |
| Doctors (29) | ⚠️ P2 | Admin API CRUD exists and public browse works; Admin dashboard CRUD is absent and location filters are limited to institution ID. |
| Library (30) | 🔐 P1 | Admin API CRUD exists. Public SSR requests all records without forcing `PUBLISHED`; client filtering cannot protect the server response. Admin dashboard CRUD is absent. |
| Blog moderation (31, 34) | ⚠️ P1 | Status moderation and approved-only public reads exist, but only Admin may author; Blog has no organization ownership/reviewer audit fields. |
| Event moderation (32, 34) | ❌ P1 | Events are Admin-only and have no approval state, author, reviewer, or approved-only public boundary. |
| Gallery moderation (33-34) | 🔐 P1 | Organization ownership/scoped mutation exists, but organization members can set `isPublished` themselves; there is no review status or reviewer audit. |
| Donor auth/profile/completion/phone (35-38) | ✅ | Registration/login/logout, own-profile updates, geographic validation, readiness, email OTP and SMS phone verification are connected and ownership-safe. |
| Referrals (39) | ⚠️ P2 | Registration stores an authoritative `referenceId`; profile/dashboard does not expose an aggregate referral count. |
| Donation history and achievements (40, 42) | ✅ | Verified donations drive history, cooldown and unique database-driven achievement unlocks. |
| Post-card generator (43) | ❌ P2 | Existing post sharing shares URLs/text only; no downloadable generated image/card exists. |
| Notifications/settings (44-45) | ✅ | Persistent scoped notifications, unread state, authenticated Socket.IO invalidation and owned donor preferences are implemented. |
| Organization dashboard/isolation (46, 48, 50) | ✅ | Scope is resolved from active membership and target records; client IDs are not treated as authority. Content additions remain required. |
| Super Admin dashboard (47) | ⚠️ P2 | Major management areas exist; Doctor/Library and complete cross-content moderation controls are missing. |
| Database integrity (49) | ⚠️ P1 | Request/donation/governance constraints are strong. Medical geography and content moderation ownership/audit columns are missing; appointment schema is obsolete. |
| Frontend quality (51) | ⚠️ P2 | Builds and typechecks pass with loading/empty states broadly present. There are 179 lint warnings and several disconnected/legacy components. |
| Redis/realtime/background (52) | ✅ | Authenticated donor rooms, shared client listener cleanup, graceful degradation, dedicated worker and durable outbox are present. |
| Deployment (53) | ✅ | Persistent runtime dependencies are deployed to compatible long-running Docker services, not serverless functions. |
| Security (54) | ⚠️ P1 | Auth, rate limiting, uploads and organization IDOR controls are sound. Content publication and medical ancestry gaps are security/data-integrity issues. |
| Performance (55) | ⚠️ P2 | Hot-path indexes, bulk seed operations and bounded queries exist. Public medical filtering still over-fetches and organization inventory read paths diverge. |
| Testing/finalization (56-66) | ⚠️ | 70 tests pass and one disposable-DB test is skipped. Several tests assert superseded requirements and need replacement with new contracts. |

## Public Application Audit

The homepage is database-backed and its Need Blood flow is correctly connected. Public post/blog visibility is enforced by the API. The Organization page incorrectly exposes internal hierarchy details and hides root advisors. The Medical page over-fetches data and does not wire the Upazila filter through every tab.

## Donor Audit

Own-profile authorization, readiness, phone/email verification, donation history, eligibility, posts, achievements, settings and notifications are connected. Referral storage exists but referral count presentation does not. No image-generating share card exists.

## Organization Audit

Membership-derived dashboard access and request/data isolation are implemented. Upazila committee members can manage scoped workflows. Obsolete appointments remain active. Blog/Event workflows are absent from organization management, Gallery can bypass Admin moderation, and public inventory uses stored rows.

## Super Admin Audit

Admin role checks are enforced server-side and the dashboard covers most models. Governance management must permit Central advisors. Complete moderation for Event/Gallery and dashboard CRUD for Doctors/Library are missing.

## Geographic/Data Model Audit

Core geography is normalized and constrained. Canonical non-Upazila hierarchy rows intentionally reuse representative geographic IDs; the anomaly audit fails to filter to `level = UPAZILA`, producing 64 false warnings. Medical institution geography is stored as unconstrained string IDs and requires safe foreign keys/ancestry validation.

## Blood Request Audit

`UI -> public POST -> Zod -> canonical organization lookup -> transactional request/outbox -> organization queue -> scoped donor assignment -> row-locked donor acceptance -> verified donation -> fulfillment -> idempotent requester SMS` is implemented. The skipped disposable-database test means real concurrent proof still requires `TEST_DATABASE_URL`.

## Approval Workflow Audit

Donor posts and Blogs have approval enums and approved-only reads. Blog lacks organization authoring/ownership. Events have no moderation model. Galleries expose `isPublished` directly to organization writers, which is a publication authorization flaw.

## Authentication & Authorization Audit

The API is the authority: JWT claims are rechecked against live database state, protected actions use current role/membership, and owner IDs derive from the authenticated email. HttpOnly cookies are primary, with Bearer support retained for server-to-server and Next middleware calls.

## Notification/SMS Audit

Notifications persist in PostgreSQL and Socket.IO only signals clients to refresh. Requester fulfillment SMS uses a unique outbox event key, worker retry/backoff and terminal dead-letter state. External delivery needs real provider credentials.

## Database Audit

Four migrations are deployed. Reconciliation reports zero lifecycle, cooldown, affiliation, governance and achievement mismatches. Phase 7 preflight is clear. The anomaly audit has one false warning caused by its query. Current configured data has 568 canonical organizations, one active committee member, zero advisors, appointments, and managed content.

## Security Audit

P1 issues are organization content self-publication and missing medical ancestry validation. No confirmed cross-organization request/donation/member IDOR was found. Production error bodies suppress stacks and raw Prisma detail; upload MIME/size limits and abuse-specific rate limits are present.

## Performance Audit

Request matching has a composite donor index; request mutations lock one request row; seeding uses transactions and bulk reconciliation; auth has a short Redis cache. Medical frontend filtering and inconsistent inventory implementations cause avoidable over-fetching/drift.

## Deployment Audit

The intended Docker architecture supports persistent Express, Socket.IO, Redis and worker timers. PostgreSQL/Redis remain internal and Nginx supports WebSocket upgrade. SMS, SMTP, Cloudinary, DNS and TLS remain operator-configured external dependencies.

## Existing Correct Implementations

- Canonical geography and organization hierarchy.
- Request routing, capacity-safe acceptance, verified fulfillment and SMS idempotency.
- Donor post entitlement and approval.
- Profile readiness, phone verification, cooldown and achievements.
- Organization isolation, notification persistence, worker/runtime architecture.

## Partial/Broken Implementations

- Root advisor governance and public display.
- Organization inventory, content moderation, medical hierarchy/filtering.
- Referral presentation, public profile statistics and medical management UI.

## Missing Implementations

- Downloadable donor post-card generator.
- Organization-owned Blog/Event moderation path.
- Admin Doctor/Library dashboard CRUD.

## Obsolete/Wrong Implementations

- Donation appointment/Booking Donation subsystem.
- Public canonical hierarchy visualization.
- False-positive duplicate-Upazila anomaly query.

## Priority

- P0: none confirmed.
- P1: publication authorization, medical ancestry, root advisors, booking removal, donor-derived inventory, public content boundaries.
- P2: referral count, post-card generator, Doctor/Library dashboard UX, lint/dead-code cleanup.
- P3: cosmetic consistency and non-blocking warnings.

## Post-Implementation Verification

The classifications above preserve the evidence captured before implementation. The confirmed P1/P2 workflow gaps were then resolved in-place: Central advisors are supported; the internal hierarchy visualization and Booking Donation subsystem are removed; organization inventory and analytics are donor-derived; public organization statistics are scoped; medical geography is validated and constrained; Doctor, Library, and Achievement Admin management is available; Blog/Event/Gallery organization ownership and Admin moderation are connected; referral count and the downloadable/shareable donor image card are implemented.

Migration `20260814210000_master_workflow_completion` was deployed successfully to the configured database. After deployment, migration anomaly audit, Phase 7 cleanup preflight, and reconciliation all reported zero discrepancies. The final production build and type checks pass. The API contract suite passes 70 tests; its one disposable-PostgreSQL test remains skipped because `TEST_DATABASE_URL` is not configured.
