# System Implementation Status

Verified: 2026-08-14 (Asia/Dhaka)

The implemented system uses canonical Central, Division, District, and Upazila organizations, separate donor affiliation and governance membership, canonical request routing, row-locked one-bag donor commitments, verification-derived fulfillment, durable notification delivery, and server-enforced Admin/organization/donor scopes.

## Current status

| Area | Status |
|---|---|
| API and web production builds | Pass |
| TypeScript | Pass |
| Prisma validation and migration status | Pass; four migrations deployed |
| API tests | 70 pass, 0 fail, 1 skipped |
| Web lint | 0 errors, 179 existing warnings |
| Migration anomaly audit | 0 blockers, 0 warnings |
| System reconciliation | Healthy; all five checks zero |
| Phase 7 preflight | All seven checks pass |
| Configured database | Seeded: 8 divisions, 64 districts, 495 Upazilas, 568 canonical organizations, and one Super Admin |

## Finalized controls

- Live database role and account status are authoritative for every protected request.
- Browser authentication uses HttpOnly cookies; login/refresh JSON and local storage no longer expose access tokens.
- Socket.IO authenticates with the same HttpOnly cookie session.
- One active Admin is enforced by a partial unique database index and seeded from explicit environment values.
- The Admin seed also owns the first National Executive committee seat in the canonical Central organization.
- Organization geography has Prisma relations, foreign keys, composite ancestry constraints, and service validation.
- One active Upazila organization and one canonical organization per geographic scope are database-enforced.
- National governance uses the canonical Central organization; National and Upazila advisors are prohibited.
- Public organization reads return active, verified organizations only; Admin reads use an authenticated endpoint.
- Public Division/District selection is encoded in the URL and is refreshable/shareable.
- Policy mutations are Zod-validated and user lookup by email is Admin-only.
- Geographic and blood-group seeds verify deterministic identities on every run instead of trusting row counts.
- Migration contract tests read the real ordered migration set.

## Remaining external release inputs

The development database is seeded. Because production-safe values were absent, development bootstrap used a placeholder organization phone and generated a one-time Admin password. Before production, configure `ADMIN_PASSWORD`, `ADMIN_FULL_NAME`, and `ORGANIZATION_SEED_PHONE` (with `ADMIN_EMAIL`) and rerun `npm run api:seed`; the configured Admin password will be re-hashed and synchronized.

A disposable `TEST_DATABASE_URL` is still required for the isolated PostgreSQL race test. Production SMTP, SMS, OAuth, Cloudinary, Redis, TLS, DNS, backup, and monitoring credentials remain deployment responsibilities. Request-level automatic expiration is intentionally not implemented until a duration and transition policy are approved.

See `BD_BILAR_MASTER_AUDIT.md`, `BD_BILAR_WORKFLOW.md`, and `BD_BILAR_IMPLEMENTATION_REPORT.md` for the detailed review and handoff.
