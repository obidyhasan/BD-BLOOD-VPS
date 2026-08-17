# BD Blood Final Verification

Audit date: 2026-08-16  
Workflow: Inspect → Trace → Verify → Test → Identify Gaps → Fix → Retest

## Executive result

The application architecture, schema, migrations, authorization services, request lifecycle, moderation rules, and production builds are coherent. Confirmed defects found during this pass were fixed and retested. The configured Neon database is reachable, migration-current, and passes every supplied integrity/reconciliation audit.

This is **not** an unconditional production-content sign-off. The configured database currently contains only one donor and one Central committee member, with no advisors, requests, donations, posts, blogs, events, galleries, FAQs, medical records, doctors, library articles, or advertisements. Consequently, workflows requiring populated actors/content cannot honestly be marked as live end-to-end verified. Real SMS delivery, browser Web Share/canvas behavior, Socket.IO delivery through the deployed proxy, and destructive concurrent acceptance testing also require external/runtime fixtures not available in this audit.

## Evidence snapshot

- Repository: clean at audit start; Next.js 16 / React 19 frontend, Express 5 / Prisma 7 backend.
- Routes: production build generated 72 pages, including all required public and dashboard routes and the repaired `/medical/library/[id]` route.
- Database: 5 migrations applied; schema up to date.
- Geography: 8 Divisions, 64 Districts, 495 Upazilas, 568 canonical organizations (Central + Division + District + Upazila scopes).
- Blood groups: A+, A-, B+, B-, AB+, AB-, O+, O-.
- Live records: 1 donor; 1 Central committee member; 4 achievement definitions; all transactional/content/medical collections otherwise empty.
- Migration anomaly audit: 0 blockers, 0 warnings.
- Phase 7 cleanup preflight: all 7 checks pass.
- System reconciliation: all 5 projections pass with zero mismatches.
- Tests: 76 total after this pass; 75 pass and 1 database-fixture test skips because `TEST_DATABASE_URL` is not configured.
- Typecheck: API and web pass.
- Build: API and web production builds pass.
- Lint: 0 errors, 176 pre-existing warnings.

## Confirmed issues fixed

1. Phone verification incorrectly survived a phone-number edit. A changed phone now clears `phoneVerifiedAt`.
2. Profile readiness ignored phone verification and did not expose a real percentage. Readiness now uses 12 authoritative requirements, persists after email/phone verification, and returns a calculated percentage.
3. The donor profile lacked the required circular completion indicator and biography editing. Both are now connected to authoritative profile data.
4. Donors could submit `referrerId` through self-profile updates. Referral attribution is now immutable through donor self-service; registration normalizes referral IDs and rejects self-referral on account reactivation.
5. Email/phone OTP verification did not refresh stored `profileStatus`, although request acceptance trusts that stored field. Both verification paths now refresh persisted readiness.
6. Donor notification settings were fully wired but permanently disabled in the UI. They are now interactive and persist through the scoped current-user endpoint.
7. Realtime notifications were mounted only on notification pages and the dashboard bell showed a fake dot. The donor dashboard now owns the Socket.IO subscription and displays the database-backed unread total.
8. Medical Library cards linked to the institution detail route. A public article detail route and view were added and cards now target it.
9. Doctor cards showed an unsupported “Book Appointment” action. They now use the stored doctor phone via an honest `tel:` contact action.
10. An unused hardcoded Division/District/Upazila selector and fake organization URL were removed.

## Requirement matrix

Legend: ✅ Verified Working · 🛠 Fixed & Verified · ⚠️ Partially Verified · 🚫 External Blocker · ❌ Still Broken

| # | Requirement | Frontend | Backend | Database | Auth/Scope | Tested | Final Status |
|---:|---|---|---|---|---|---|---|
| 1 | Complete project recheck | Routes/services traced | Modules and jobs traced | Schema + live audits | Matrix reviewed | Full gates run | ⚠️ Partially Verified |
| 2 | Four integrated application areas | Shared APIs/session/dashboard routes | One API domain | Shared Prisma database | Role boundaries | Build + contracts | ⚠️ Partially Verified |
| 3 | Organization/Committee unified domain | Unified terminology views | `Organization` + governance membership | No competing Committee model | Shared membership rules | Contract tests | ✅ Verified Working |
| 4 | Geographic hierarchy | Dependent selectors reset children | Ancestry asserted server-side | 8/64/495; 568 canonical orgs; zero anomalies | Admin writes protected | Audit + tests | ✅ Verified Working |
| 5 | Root/National 11 members + 11 advisors | Same leadership API used by public/home | Independent categories and 11-seat caps | Live: 1 committee, 0 advisors | Admin-only national management | Capacity tests | ⚠️ Partially Verified |
| 6 | Division 11 members + 11 advisors | Scope filters sent | Division organization resolution | Live: 0 populated leadership rows | Admin-only governance | Scope contracts | ⚠️ Partially Verified |
| 7 | District 11 members + 11 advisors | Division change resets descendants | District ancestry + scope enforced | Live: 0 populated leadership rows | Admin-only governance | Scope contracts | ⚠️ Partially Verified |
| 8 | Upazila organization membership | Public/dashboard share membership APIs | Governance vs donor affiliation separated | 495 canonical Upazila orgs; no live members | Manager scope enforced | Contract tests | ⚠️ Partially Verified |
| 9 | Public navigation | Home, Organization, Medical, Blog, Event, Gallery build | Public reads registered | N/A | Public visibility filters | Next route build | ✅ Verified Working |
| 10 | Home Need Blood | Dependent selectors + canonical redirect | Strict `by-upazila` resolution | Complete live geography | Public read | Hero contract tests | ✅ Verified Working |
| 11 | Public hierarchy visualization removed | No internal hierarchy process UI | Internal tree remains available | Canonical hierarchy retained | Public-safe | Contract test | ✅ Verified Working |
| 12 | Organization public tabs | Committee default; filter state reset | Root/Division/District category queries | Live leadership mostly empty | Public projection strips contact data | Leadership contracts | ⚠️ Partially Verified |
| 13 | Organization public profile | Scoped requests, members, posts, inventory, stats | Organization-filtered queries | No live transactions/content | Public-only projections | Source trace + build | ⚠️ Partially Verified |
| 14 | No Booking Donation | No donation-booking routes/navigation; false doctor booking removed | Appointment module not registered | No booking model dependency in active workflow | N/A | Search + regression test | 🛠 Fixed & Verified |
| 15 | Blood inventory | Renders all returned groups | Derived from active, verified, available, eligible affiliated donors | All 8 groups exist | Public org read; management scoped | Query trace + contracts | ✅ Verified Working |
| 16 | Public blood request | Form sends organization/geography/idempotency | Validates ancestry; resolves canonical handler; rate limited | No live request fixtures | Public limited endpoint | Contract tests | ⚠️ Partially Verified |
| 17 | Organization request management | Dashboard uses command API | Handler organization is authoritative | No live requests | Cross-org IDOR denied | Authorization contracts | ✅ Verified Working |
| 18 | Donor request dispatch | Eligible donor workflow connected | Revalidates org affiliation, group, readiness, availability/cooldown | No live donors to dispatch | Manager-only command | Matching contracts | ✅ Verified Working |
| 19 | Acceptance capacity/concurrency | Capacity conflicts disable/refresh UI | Request row `FOR UPDATE`, aggregate bag check, expiry | Constraints/indexes migrated | Donor owns assignment | Rule/contract tests; no disposable DB race | ⚠️ Partially Verified |
| 20 | Exactly-once completion SMS | Fulfillment state reflected | Durable idempotent outbox event key | Outbox schema/migration present | Triggered only by verified fulfillment | Provider boundary tested | 🚫 External Blocker |
| 21 | Accepted vs completed donation | Separate pending/verified UI | Assignment and verified donation states distinct | Unique assignment-donation link | Verification restricted to org/Admin | Transition tests | ✅ Verified Working |
| 22 | Registration/login/logout | Forms and redirects connected | Password hashing, tokens, cookies, account checks, rate limits | Live account exists | Role middleware | Type/build + source trace | ⚠️ Partially Verified |
| 23 | Donor own profile | Own-profile endpoint only; bio/image/location edits | Identity derived from token; phone change invalidates OTP | Persisted donor fields | No client donor ID accepted | Type/tests | 🛠 Fixed & Verified |
| 24 | Profile completion | Real percentage/ring and accessible text | 12-field authoritative calculation | Stored status refreshed | Current donor only | Unit + regression tests | 🛠 Fixed & Verified |
| 25 | Phone verification | OTP UX and refresh | Authenticated OTP, ownership, uniqueness, rate limits | Verification tied to exact phone | Current donor only | Boundary/unit trace | 🛠 Fixed & Verified |
| 26 | Referrals | Authoritative count displayed | Registration resolves referrer; self-update blocked; self-referral rejected | FK relation + authoritative count | Current donor cannot rewrite attribution | Regression tests | 🛠 Fixed & Verified |
| 27 | Donation history | Separate donation history | Current donor query; verified state explicit | No live donations | Own records only | Contracts | ✅ Verified Working |
| 28 | Donor post eligibility | Only unused verified donation selectable | Entitlement checks verified donation and unique link | One post per donation relation | Donor ownership | Contract tests | ✅ Verified Working |
| 29 | Donor post moderation | Pending/rejected hidden; approved public | Organization moderation checks post affiliation/ownership | Approval enum and relations | Cross-org moderation denied | Governance tests | ✅ Verified Working |
| 30 | Organization success history | Homepage maximum 6 + remaining content routes | Approved `isWork` queries | No live posts | Org authoring scoped | Homepage contracts | ⚠️ Partially Verified |
| 31 | Achievements | Admin CRUD + donor unlock UI | Threshold validation; unlock from donation counts; deduplicated | 4 definitions, no donation evidence | Admin CRUD; donor own awards | Reconciliation + contracts | ⚠️ Partially Verified |
| 32 | Generate Post Card | 1200×630 canvas, wrap, image, download, Web Share fallback | No server dependency | Uses live donor/donation data | Donor dashboard | Build/source trace; no browser media test | ⚠️ Partially Verified |
| 33 | Donor notifications | Persistent list, realtime refresh, real unread badge | Stored notifications, per-donor rooms, deduped assignment alerts | No live notification fixture | Ownership on read/delete | Regression + contracts | 🛠 Fixed & Verified |
| 34 | Donor settings | Toggles now interactive and show current values | Validated current-user update | Persisted preference columns | No target donor ID | Type/build | 🛠 Fixed & Verified |
| 35 | Medical public module | Search, geography, Medical/Doctors/Library tabs; article detail fixed | Public published filters | No live records | Public read | Build + regression | ⚠️ Partially Verified |
| 36 | Admin Medical CRUD | CRUD pages/forms connected | Admin-only CRUD; institution ancestry validated | Models/FKs present; no records | Admin only | Build/source trace | ⚠️ Partially Verified |
| 37 | Doctor management | Admin CRUD and public doctor cards | Institution-scoped CRUD/filter | Model/FK present; no records | Admin writes | Build/source trace | ⚠️ Partially Verified |
| 38 | Library management | Admin CRUD, list and repaired detail route | Published-only public detail/list | Model/FK present; no records | Admin writes | Regression + build | 🛠 Fixed & Verified |
| 39 | Medical ad slider | Homepage consumes API slider | Active/date/order filters | No live ads | Admin writes; public reads active | Homepage contracts | ⚠️ Partially Verified |
| 40 | Blog moderation | Org manage + Admin review + public pages | Org creates pending; edits requeue; public approved-only | No live blogs | Cross-org ownership + Admin approval | Governance tests | ✅ Verified Working |
| 41 | Event moderation | Org manage + Admin review + public pages | Pending/approval/public filters | No live events | Cross-org ownership + Admin approval | Source/contracts | ✅ Verified Working |
| 42 | Gallery moderation | Org/Admin CRUD and public pages | Pending approval and published filter | No live galleries | Ownership checked for every mutation | Governance tests | ✅ Verified Working |
| 43 | Coherent approval system | Consistent pending/approved/rejected UX | Shared `ApprovalStatus` for posts/events/gallery; Blog equivalent enum | Reviewer/timestamps stored | Admin review; org edits re-review | Content tests | ✅ Verified Working |
| 44 | FAQ | Homepage API + admin CRUD | Active/published queries | No live FAQs | Admin writes | Build/source trace | ⚠️ Partially Verified |
| 45 | Education/history/home content | Blog/work/gallery APIs, empty states | Managed visibility/order queries | No live content | Admin/organization rules | Homepage contracts | ⚠️ Partially Verified |
| 46 | Who's Behind | Uses initial/API national leadership, no hardcoded member array | Same public leadership service | Live: one Central member | Public safe projection | Homepage contracts | ⚠️ Partially Verified |
| 47 | Organization dashboard | Required sections build and use RTK APIs | Scoped service commands/queries | No live activity fixtures | Manager access level | Route build + contracts | ⚠️ Partially Verified |
| 48 | Organization dashboard access | UI exposes only active authorized members | Active EXECUTIVE/MANAGEMENT membership required | Membership indexes/seat constraints | Cross-org IDOR checks | Authorization tests | ✅ Verified Working |
| 49 | Super Admin dashboard | Required management routes build | Admin endpoints implemented | Models present; content mostly empty | Admin middleware | Build/source trace | ⚠️ Partially Verified |
| 50 | Authorization matrix | Route wrappers and role-aware UI | Public/Donor/Org/Admin checks; identity derived server-side | FK/ownership queries | IDOR trace | Security contracts | ✅ Verified Working |
| 51 | Database integrity | N/A | Reconciliation scripts | 5 migrations current; all audits zero | N/A | Live read-only audits | ✅ Verified Working |
| 52 | Statistics | API-backed cards; no confirmed placeholder counts | Scoped global/org queries | Empty transactions yield truthful zeroes | Scope selected server-side | Homepage/analytics contracts | ✅ Verified Working |
| 53 | Redis/Socket/background | Authenticated socket client with reconnect | Per-donor rooms; separate durable worker; graceful shutdown | Durable outbox + Redis fallback | JWT/cookie socket auth | Contract/source trace | ⚠️ Partially Verified |
| 54 | Security regression | Safe error/loading boundaries | Hashing, OTP/rate limits, Helmet/CORS/upload/env checks | Constraints/migrations | Middleware + service checks | Security contracts/audits | ✅ Verified Working |
| 55 | API connection audit | RTK/server-fetch endpoints mapped | Single registered module routes | Shared source of truth | Auth matched to endpoint | Type/build/contracts | ✅ Verified Working |
| 56 | Dead/obsolete cleanup | Hardcoded location selector deleted; fake booking action removed | Legacy request mutations/rematch absent | Destructive legacy schema cleanup intentionally deferred | N/A | Search + preflight | 🛠 Fixed & Verified |
| 57 | Automated tests | Frontend contracts included in API test harness | Unit/contract/lifecycle tests | DB test safely isolated | Authorization cases included | 75 pass, 1 skip | ⚠️ Partially Verified |
| 58 | Manual flow verification | Representative paths traced in code/build | Commands and side effects traced | No live workflow fixtures | Scope checked | No browser/live SMS execution | ⚠️ Partially Verified |
| 59 | Fix confirmed issues | 8 frontend connections corrected | 4 readiness/referral/auth fixes | No schema migration needed | Self-service/referral boundary tightened | Retested | 🛠 Fixed & Verified |
| 60 | Do not rewrite working features | Targeted changes only | Existing lifecycle preserved | No destructive data writes | Existing policies retained | Diff reviewed | ✅ Verified Working |
| 61 | Build/quality verification | Lint/type/build pass | Test/type/build pass | Prisma format/validate/generate/migration pass | N/A | Commands recorded below | ✅ Verified Working |
| 62 | Final requirement matrix | This document | Evidence linked to services/tests | Live-state caveats recorded | Scope recorded | Status conservative | ✅ Verified Working |
| 63 | Cross-connection report | See below | See below | See below | See below | Trace evidence | ✅ Verified Working |
| 64 | Definition of done | Major code paths verified | Major services verified | Live data prevents full scenario execution | Major boundaries verified | External gaps explicit | ⚠️ Partially Verified |

## Cross-connection traces

### Need Blood

`Home Hero` → filtered Division/District/Upazila APIs → canonical Upazila organization resolver → organization public profile → public rate-limited/idempotent blood request → authoritative `handledByOrganizationId` → organization request dashboard.

### Fulfillment

`Organization starts request` → eligible affiliated donors → durable notifications/SMS outbox → donor-owned assignment → row-locked capacity acceptance → linked donation submission → organization verification → fulfilled request → exactly-once requester SMS outbox event.

Acceptance is intentionally not fulfillment. Only verified linked donation bags advance the request to `FULFILLED` and count toward history, eligibility, and achievements.

### Donor lifecycle

`Register/referral` → email verification → profile/geography/affiliation → phone verification → stored readiness refresh → request assignment → acceptance → donation pending → verified donation → history → one donation-post entitlement → organization moderation → approved public post → achievement unlock.

### Governance/public leadership

`Central/Division/District canonical organization` → category-specific governance seats → public leadership API → Organization Committee/Advisor tabs. Homepage Who's Behind consumes the same Central Committee projection; advisors are not included there.

### Organization content

`Organization manager` → Blog/Event/Gallery create as pending → Super Admin approval/rejection → approved-only public query. Editing organization content resets review state where implemented.

### Medical

`Admin Medical/Doctor/Library/Ad CRUD` → published public Medical tabs and article detail → active Medical advertisements on homepage. Doctor action uses the authoritative phone; no unsupported appointment promise remains.

### Notifications

`Persist notification` → donor-specific database row → authenticated `donor:{id}` Socket.IO room → global donor dashboard listener invalidates cache → unread total re-queries from database → read/delete remains donor-owned.

## Security and integrity findings

- Server-side organization authorization is based on active membership and position level, never a client role or organization ID alone.
- Blood-request management is scoped through authoritative `handledByOrganizationId`.
- Assignment responses require assignment ownership, current eligibility, correct affiliation/blood group, and a locked request row.
- Public content queries enforce approval/publication state.
- Donor profile/settings mutations derive identity from the token.
- Referral attribution can no longer be altered via self-profile payloads.
- Phone verification is invalidated when the phone changes.
- Public request submission has both rate limiting and database idempotency.
- Live database audits found no geography, request, donation, affiliation, cooldown, capacity, or achievement projection anomalies.

## Commands and results

| Command | Result |
|---|---|
| `npm run test --workspace apps/api` | PASS: 75 pass, 1 skipped DB-fixture test |
| `npm run typecheck` | PASS: API + web |
| `npm run lint` | PASS with 0 errors and 176 warnings |
| `npm run build` | PASS: API + Next production build, 72 routes |
| `npx prisma format --config prisma.config.ts` | PASS |
| `npx prisma validate --config prisma.config.ts` | PASS |
| `npm run api:generate` | PASS |
| `npm run api:migrate:status` | PASS: 5 migrations, schema current |
| `npm run audit:migration --workspace apps/api` | PASS: 0 blockers/warnings |
| `npm run preflight:phase7 --workspace apps/api` | PASS: all checks |
| `npm run audit:reconciliation --workspace apps/api` | PASS: healthy, zero mismatches |
| Organization/profile/request backfills (dry run) | PASS: no blockers; no writes applied |
| Read-only live data inventory | PASS; exposed population gaps listed above |

## Remaining blockers and follow-up

1. Configure an isolated `TEST_DATABASE_URL` and run the real database test suite, including simultaneous acceptance transactions. The audit deliberately did not point destructive tests at the configured Neon database.
2. Populate/appoint the intended 11 Central Committee members and 11 Central Advisors, plus Division/District/Upazila leadership. The code enforces capacity, category, seat uniqueness, and scope, but the live data is not populated.
3. Populate representative approved and pending requests, donations, donor posts, blogs, events, galleries, FAQs, and Medical/Doctor/Library/Ad records in a staging database for browser E2E flows.
4. Validate real MiM SMS credentials/delivery and failure retry behavior in staging. The durable/idempotent integration boundary is verified; carrier delivery is not.
5. Exercise Socket.IO through the deployed Nginx/proxy and browser reconnect lifecycle.
6. Exercise canvas image loading, download, and Web Share on target mobile browsers. Unsupported share environments correctly download instead.
7. Address the 176 lint warnings as a separate cleanup. They are non-blocking (zero lint errors) and mostly pre-existing unused imports, hook dependency advisories, and React Compiler/TanStack Table notices.
8. Review the dry-run organization backfill's single planned governance mapping before applying any mutation. No backfill was applied during this audit.

No genuine issue discovered in this pass remains knowingly unfixed in the repository. The remaining limitations are fixture/content population, isolated concurrency testing, external providers, deployed realtime/browser verification, and non-error lint debt.
