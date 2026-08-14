# BD Blood Implementation Report

Finalization date: 2026-08-14 (Asia/Dhaka)

## Outcome

The repository was reviewed twice before modification. Existing working request, donation, affiliation, notification, dashboard, and content workflows were preserved. Confirmed security, integrity, seed, governance, public-navigation, validation, and test gaps were corrected in the existing architecture.

## Implemented changes

### Authentication and authorization

- Protected-route role checks now use the current database role, not a possibly stale JWT role.
- Login and refresh tokens are delivered only as HttpOnly cookies. Access-token Redux/local-storage state, bearer injection, and the client token-sync path were removed.
- Server-side Next.js refresh mediation reads backend `Set-Cookie` headers; it does not require browser-readable token JSON.
- Socket.IO now authenticates from the HttpOnly access cookie.
- The authenticated email lookup endpoint is Admin-only; donors use `/user/me` for their own record.

### Geography and organizations

- Organization creates/updates validate the actual Division → District → Upazila ancestry.
- Prisma now models Organization relations to all three geographic tables.
- Deployed database constraints enforce geography names within their parent, organization ancestry, one active Upazila organization, one canonical organization per scope, request units from 1–10, and one bag per assignment.
- Public list/detail/slug reads expose active, verified organizations. Admin lists use `/organizations/admin` with live Admin authorization.
- Duplicate legacy public organization registration is rejected in favor of the seeded canonical Upazila organization.

### Governance and Admin seed

- New National memberships resolve to the canonical Central organization rather than a null organization.
- National and Upazila advisor appointments are rejected during assignment and activation; the public root advisor tab/query is suppressed.
- National seat reservation checks are scoped to the Central organization.
- A partial unique index permits at most one active `Role.ADMIN` donor.
- The environment-driven, idempotent seed creates exactly one verified Admin and assigns it to the first National Executive committee seat. It refuses duplicate privileged accounts, implicit promotion of a donor, weak passwords, or missing configuration.

### Frontend, validation, and tests

- Organization Division/District/Upazila state is reflected in URL query parameters for refreshable deep links.
- Policy writes use Zod schemas; category and active filters are parsed defensively.
- Geographic and blood-group seeds reconcile deterministic IDs instead of skipping based only on counts.
- Stale migration tests now inspect all actual migrations and pass after consolidation.
- Audit and workflow documentation was added and the stale system status was replaced.

## Database rollout performed

The following forward migrations were deployed successfully to configured `neondb`:

1. `20260814143000_audit_integrity`
2. `20260814170000_single_super_admin`
3. `20260814190000_canonical_level_cutover`

The database reports all four repository migrations applied. No ambiguous data rewrite was performed; the level cutover clears only the obsolete `type` value from canonical hierarchy rows after readers moved to `Organization.level`.

## Verification evidence

| Verification | Final result |
|---|---|
| API tests | 70 pass, 0 fail, 1 skipped |
| Skipped test | Disposable database test; `TEST_DATABASE_URL` absent |
| API production build | Pass |
| Next.js production build | Pass; 69 pages generated |
| API and web TypeScript | Pass |
| Prisma format/validation | Pass |
| Migration deployment/status | Pass; database current |
| Web ESLint | 0 errors, 179 pre-existing warnings |
| Migration anomaly audit | All 9 checks zero |
| Reconciliation audit | Healthy; all 5 checks zero |
| Phase 7 preflight | All 7 checks zero; ready flag true |

## Seed rollout performed

The configured development database was successfully seeded with 8 divisions, 64 districts, 495 distinct Upazilas, 568 canonical organizations, eight blood groups, four achievement definitions, and one Super Admin holding the National committee seat.

Development bootstrap generated a one-time Admin password and used `+8801000000000` as the organization coordination placeholder. Before release, set:

- `ADMIN_PASSWORD` (minimum 12 characters, unique)
- `ADMIN_FULL_NAME`
- `ORGANIZATION_SEED_PHONE`
- confirm the existing `ADMIN_EMAIL`

Then rerun:

```powershell
npm run seed --workspace apps/api
```

The rerun synchronizes the configured password for the existing Admin. Afterward, rerun migration status, anomaly audit, reconciliation, and Phase 7 preflight.

## Explicitly deferred

- Request-level expiration: no duration or approved transition behavior was supplied. Assignment expiration remains implemented.
- Real database race proof: requires a disposable `TEST_DATABASE_URL` and must never target production.
- Geographic source reconciliation: the corrected deterministic seed contains 8 divisions, 64 districts, and 495 distinct Upazilas; periodically compare names/administrative changes with the Bangladesh National Portal.
- The 179 lint warnings are non-blocking legacy cleanup, not finalization errors.
