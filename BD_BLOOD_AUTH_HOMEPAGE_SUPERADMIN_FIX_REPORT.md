# BD Blood Auth, Homepage, and Super Admin Fix Report

Date: 2026-08-17

## Auth/Navbar Root Cause

The public navbar called the cookie-authenticated `/user/me` endpoint on mount, but the shared RTK Query base layer did not refresh and retry after a `401`. An expired access-token cookie with a still-valid refresh-token cookie therefore looked logged out on public pages. Visiting `/login` happened to repair the state because the Next.js proxy refreshes tokens for auth/private routes before redirecting an authenticated user to the dashboard.

The navbar also preferred the localStorage-backed Redux profile over the authoritative `/me` result. Mobile navigation always rendered a Sign In action regardless of session state.

## Auth Fix

- Added one-flight client session refresh to the shared RTK Query base query.
- A `401` now calls `/auth/refresh-token`, retries the original request once, and clears stale local profile state only when refresh is rejected.
- `useSessionUser` synchronizes successful `/me` data into Redux/localStorage.
- Public desktop and mobile navigation now render from authoritative `/me` data.
- Initial auth resolution renders a neutral skeleton; it does not render a false Sign In state.
- Account links remain role-aware through the existing `ADMIN`/`DONOR` routing and organization-membership architecture.

## Homepage Initial Data Root Cause

Several homepage sections started a client fallback query when their server-provided array was empty, but rendered with `initialData ?? fetchedData`. An empty array is non-null, so the later successful client response was ignored. Success History, Donor Posts, divisions, Medical ads, blogs, gallery, FAQ, and Root leadership were affected in different combinations. Success History, Donor Posts, and Root leadership also lacked a complete client fallback query.

Server services intentionally convert initial transport failures to empty fallback payloads. That made this empty-array selection bug especially visible on a cold API start or failed initial server fetch. Navigating away and back caused a new server render after the API was ready, which made the content appear.

## Homepage Data Fix

- Added a shared `/posts/homepage` RTK Query endpoint for Success History and Donor Posts.
- Added client fallback loading for Root leadership.
- Changed all affected sections to prefer initial data only when it contains records; otherwise they consume the client response.
- Kept public content queries independent from `/me` and session resolution.
- Added distinct skeleton, error/retry, genuine empty, and success states for important homepage sections.
- Retained the existing authoritative public endpoints and approval/publication filters; no static demo arrays were introduced.
- The homepage remains dynamically rendered where required, while public resource caches retain their deliberate tag/revalidation policies.

## Super Admin Membership Audit

One canonical governance system is used for Root, Division, District, and Upazila scopes.

| Scope | Committee | Advisors | Audit result |
| --- | ---: | ---: | --- |
| Root/Central | up to 11 | up to 11 | Live audit found 11 + 11 |
| Division | up to 11 per Division | up to 11 per Division | Live sampled scopes found 11 + 11 |
| District | up to 11 per District | up to 11 per District | Live sampled scopes found 11 + 11 |
| Upazila | up to 11 | Not permitted by the established model | Live sampled scopes found 11 + 0 |

Verified controls include:

- transactional capacity checks protected by PostgreSQL advisory locks;
- unique scoped position-seat keys and duplicate prevention;
- active, verified registered-donor eligibility;
- Admin-only Root/Division/District assignment and reassignment;
- scoped Upazila organization management and dashboard authorization;
- independent Committee and Advisor categories;
- public Root/Division/District filtering and Upazila organization-profile redirect;
- mutation tag invalidation for admin and public membership consumers.

## Super Admin Functionality Fixes

- Removed the duplicate-looking Central assignment choice: “National / Root” resolves to the single canonical Central organization.
- Central records are normalized back to that Root choice while editing.
- Assignment choices now display explicit level and geography (`DIVISION`, `DISTRICT`, `UPAZILA` with their hierarchy), reducing wrong-scope selection risk.
- Existing promote, edit/reassign, remove/deactivate, filter, authorization, validation, API, database, and refresh paths were rechecked through type contracts, source integration tests, production builds, and the live public/admin audit.
- The full Admin route set compiles in the production build, including donors, requests, donations, achievements, organizations, leadership, approvals, inventory, positions, posts, work, blogs, events, gallery, FAQ, medical institutions, doctors, library, ads, reports, policies, notifications, and settings.

## Super Admin UI Improvements

- The membership assignment UI now presents one Root scope and human-readable geographic context instead of ambiguous organization names.
- Existing responsive cards, filters, loading skeletons, dialogs, error toasts, and empty states were preserved.
- The change is focused on governance clarity and does not redesign unrelated Admin pages.

## Medical Banner Fix

- Removed the `opacity-10` and grayscale treatment that obscured the managed advertisement image.
- The image now renders at full opacity with responsive `fill`, `sizes`, `object-cover`, and centered positioning.
- The first slide is prioritized for loading.
- Replaced the heavy white wash with a localized light text-readability gradient.
- Added a safe visual fallback when an ad has no image.
- Slider autoplay and responsive heights remain intact.

## Tests

- `npm exec --workspace apps/api -- prisma validate` — passed.
- `npm run api:generate` — passed.
- `npm run typecheck` — passed for API and web.
- `npm run lint` — passed with 0 errors; 172 existing repository warnings remain.
- `npm test --workspace apps/api` — 84 tests: 83 passed, 1 database-isolation test skipped because `TEST_DATABASE_URL` is not configured.
- `npm run build` — API and Next.js production builds passed; all 73 pages generated/validated.
- `npm run audit:public-admin` — passed against the configured database; Root 11 + 11 and sampled Division/District 11 + 11 scopes verified.
- `npm run verify:demo` — passed; 142 donors, 131 governance seats, 10 approved posts, 3 ads, 4 FAQs, and related demo projections verified.

New regression coverage checks initial cookie-session refresh/retry, authoritative navbar rendering, empty-server-data client fallback, homepage loading/error behavior, and Medical banner image visibility.

## Remaining Blockers

- `TEST_DATABASE_URL` is not configured, so the disposable-database connection test remains skipped. The configured live database audits passed.
- This execution environment has no browser automation connector, so authenticated hard-refresh/new-tab/logout visual checks were validated through the session architecture, regression contracts, API/database audits, and production build rather than an automated browser run. A final deployed-browser smoke test remains recommended for cookie-domain and deployment-proxy configuration.
