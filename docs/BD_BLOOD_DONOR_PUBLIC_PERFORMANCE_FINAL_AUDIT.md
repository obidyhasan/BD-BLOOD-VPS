# BD Blood Donor, Public, and Performance Final Audit

Date: 2026-08-17

## Donor Features Reviewed

- Authentication/session initialization, protected donor layout, refresh behavior, logout, and role-aware navigation.
- Profile reads/updates, avatar, blood group, biography, Division/District/Upazila, canonical Organization affiliation, availability, and server-derived readiness.
- Authenticated phone OTP send/verify, resend controls, expiry/attempt/rate-limit enforcement, and readiness refresh.
- Blood-request dispatch notifications, assignment ownership, acceptance/rejection/withdrawal, capacity locking, linked donation submission, and Organization verification.
- Donation history, achievements, referrals, donor posts, moderation states, notifications, settings, and the 1200x630 share/download card.
- Public donor/profile routes, homepage sections, Root Committee source, Organization directory/profile, Medical, Blog, Event, Gallery, public content projections, and detail routes.

## Broken Donor Functionality

- `canCreateDonationPost` was always overwritten to `false`, even when a donor had an eligible verified donation.
- Self-update validation accepted `accountStatus`, allowing a donor to submit an authoritative platform status field.
- Editing a verified phone displayed the new, unverified number as verified until save/refresh.
- Donation totals and recent activity included pending/rejected records; the history page also showed fabricated impact and a hardcoded achievement.
- A read assignment notification stopped presenting request actions, and the notification page mounted a duplicate Socket.IO listener.
- Requester phone data was returned before assignment acceptance.
- Private `/posts/*` server reads could be classified as public first and lose the access token.
- Public donor UUID links performed a failed slug request followed by a second request.

## Donor Fixes

- Post capability now requires both operational profile readiness and one donor-owned, verified, unused donation.
- Removed `accountStatus` from donor self-update validation; ownership remains derived exclusively from the authenticated identity.
- Phone verification now matches the exact normalized persisted phone and validates Bangladesh mobile numbers.
- Profile summaries and recent activity now use verified donations only; the location shows Upazila, District, and Division.
- Removed the fabricated `Elite Life-Saver` badge, static biography, unsupported lives-impact claim, and hardcoded Centurion milestone.
- Added `/dashboard/donor/requests`, backed by the same authorized assignment workflow and filtered to request assignments.
- Request actions remain available after a notification is read. Requester contact is disclosed only after accepted/donation-progress states.

## Button/Form Fixes

- Create Post is enabled only when the server reports an eligible unused donation and opens a donation-only form.
- Donation-only creation defaults to a recap, requires an eligible donation, and does not expose Organization broadcast categories.
- OTP input is numeric and one-time-code aware; the profile phone field uses Bangladesh validation and telephone autocomplete.
- Donation/request load failures now expose working retry actions; donation history has Previous/Next pagination.
- Existing request Accept, Reject, View, Submit Donation, and Withdraw actions are reused on the dedicated request page.
- Share-card generation uses the resolved profile image URL; native Web Share and download fallback remain real browser flows.

## Donor ↔ Organization Sync

- Request commands remain donor-owned and transaction/row-lock protected, with affiliation, blood group, readiness, cooldown, capacity, and terminal-state checks.
- Verified linked donations remain the authoritative source for fulfillment, history, achievements, and post eligibility.
- Ordinary donors can create only donation-backed personal posts. Non-personal Organization posts require an active EXECUTIVE or MANAGEMENT membership, including on update.
- The unique donation-to-post relation continues to prevent duplicate posts for the same donation. Moderation/public reads continue to use the authoritative approval and visibility state.

## Donor ↔ Super Admin Sync

- Achievement definitions and thresholds remain database-managed by Super Admin; donor unlocks derive from verified donation counts.
- Donation verification/reversal now invalidates Achievements and Auth/profile capability caches as well as donation/request data.
- Existing account, referral, structure, and content moderation sources remain authoritative rather than copied into donor-local state.

## Donor ↔ Public Sync

- Public donor routes resolve both slugs and UUID fallback links through one backend lookup.
- Public donor pages return the framework 404 state when missing and fetch at most 24 approved donor posts only after the donor resolves.
- Public post projections continue to strip donor contact credentials and require approved/public content.

## Public Routes Reviewed

- Home, Organization and Organization profile, Medical and Library details, Blog/details, Event/details, Gallery/details, public post/details, request tracking, and donor profiles.
- Public projections were rechecked for approval/publication constraints and private-field exclusion.
- Authenticated public navbar initialization remains cookie/session-driven on direct load and refresh.

## Homepage Fixes

- Independent homepage data sources remain fetched concurrently.
- Homepage posts now use the deliberate tagged public cache instead of forcing `no-store`.
- Root leadership explicitly requests `category: COMMITTEE` and `level: EXECUTIVE` from the Super Admin-managed membership source.

## Root Member Verification

- The Who's Behind section uses the public leadership membership endpoint, not donor arrays or homepage-specific records.
- The UI preserves the configured order and caps display at 11. Advisors remain a separate category/tab.

## Naming Improvements

- Simplified donor labels to Profile, Blood Requests, Donation History, Notifications, Posts, Reports, and Settings.
- Replaced technical `Text Messages (SMS via MiM SMS)` with `Text message alerts`.
- Removed the single-child History submenu and simplified post/profile explanatory text.

## Query Optimizations

- Profile affiliation resolution and eligible-donation lookup now run in parallel; eligibility uses `findFirst` with an ID-only select.
- Public donor UUID/slug resolution no longer causes a sequential failed-request fallback.
- Public donor posts are conditional on a valid donor and reduced from 50 to 24.
- Donation history is server-paginated at 10 rows; verified lifetime total uses the filtered pagination count rather than loading all records.
- Homepage's eight independent service reads remain parallelized.

## Database Index Changes

- No migration was added. Existing schema indexes already cover the confirmed hot paths: donor blood/availability/geography, request status/Organization, assignment donor/status, donation donor/status/Organization, notification donor/created time, and post approval/Organization/created time.
- Adding redundant indexes without query-plan evidence was intentionally avoided.

## Caching Strategy

- Private donor, donation, request, notification, report, and Organization-management reads remain `no-store` and authenticated.
- Private endpoint classification now takes precedence over broad public prefixes for token attachment, 401 refresh, and cache selection.
- Approved public posts use a 60-second freshness window; public Organization data uses five minutes. Mutations continue to invalidate RTK Query and Next cache tags where supported.
- Operational requests/notifications are never placed in shared public cache.

## Page Load Improvements

- Removed the homepage post `no-store` override, allowing SSR data reuse with a short freshness boundary.
- Removed the donor profile's duplicate public donor fallback call and reduced the public post payload.
- Removed a duplicate donor notification socket subscription; the donor layout owns the connection and cache invalidation.
- Production build completed 75 pages successfully; the new Blood Requests route is statically compiled with client-scoped live data.

## Image/Frontend Optimizations

- Existing Next Image sizing/lazy behavior was retained; the above-fold donor image remains prioritized.
- Share-card image loading now receives the same resolved profile-photo URL as the visible profile.
- The existing canvas card remains 1200x630 with fallback initials, wrapped text, download, and Web Share support.

## Dead Code Removed

- Removed the no-trigger PostDialog instance from the profile page.
- Removed duplicate socket initialization from donor notifications.
- Removed fake badge, unsupported static impact text, static biography, and hardcoded milestone logic.

## Tests

- API regression/contract suite: 90 tests, 89 passed, 0 failed, 1 skipped (`TEST_DATABASE_URL` not configured).
- Added regression coverage for self-service account-status protection, verified-donation post capability, requester contact disclosure, and authenticated private server reads.
- Updated homepage contracts for explicit Committee membership and deliberate short-lived caching.
- Typecheck: API and Web passed.
- ESLint: passed with 0 errors; 142 existing repository warnings remain.
- Prisma generate, validate, and format check: passed.
- Demo database verification: passed (142 donors, 131 governance seats, 7 requests, 18 assignments, 10 approved posts, and all configured public demo datasets).

## Build Results

- API production build: passed.
- Next.js production build: passed (75/75 pages generated; `/dashboard/donor/requests` included).
- `git diff --check`: passed.

## Remaining External Blockers

- Database integration tests require a disposable `TEST_DATABASE_URL`; the suite deliberately does not fall back to a production/development database.
- Live OTP/SMS delivery, SMTP delivery, Redis fan-out, and multi-browser Socket.IO behavior require configured external services and credentials. Their code paths, fail-closed production behavior, ownership, retry, and persistence contracts were reviewed, but provider delivery cannot be proven by an offline build.
- Cache freshness across separate running Next.js instances depends on the deployment's shared invalidation strategy; the short public TTL provides a bounded fallback when mutations occur outside Next server actions.
- Demo verification reported the PostgreSQL driver's upcoming SSL-mode semantic change; the deployment connection string should explicitly use `sslmode=verify-full` to retain the current certificate-verification behavior before the next major `pg` release.
