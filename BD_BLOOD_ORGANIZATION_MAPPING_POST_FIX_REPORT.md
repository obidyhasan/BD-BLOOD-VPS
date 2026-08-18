# BD Blood Organization Mapping and Post Fix Report

## Upazila -> Organization Seed Result

- Seed source: `apps/api/src/app/seed/geoSeed.ts` supplies the active Division, District, and Upazila hierarchy.
- Organization source: `apps/api/src/app/seed/organizationSeed.ts` derives canonical rows directly from each seeded Upazila.
- Naming convention: `${upazila.name} Upazila Organization`.
- Identity: deterministic UUID scope `UPAZILA:${upazila.id}`.
- Seed order remains `geo -> blood groups -> achievements -> canonical organizations -> super admin`.
- Existing valid organization rows are preserved. The seed only creates missing rows.
- A post-seed reconciliation now verifies exactly one active canonical Upazila organization for every seeded Upazila and validates the Division/District/Upazila ancestry.
- Duplicate active Upazila organizations are prevented by the deployed partial unique index `organizations_active_upazila_key` on `organizations.upazilaId` for `level = 'UPAZILA' AND isDeleted = false`.
- No live database count was claimed because database status and seed commands were denied before execution in this session. The seed reconciliation will fail loudly on missing, duplicate, or invalid mappings when run against the database.

## Navbar Overlap

- Root cause: `Navbar` is fixed at the top of the viewport, while the public layout had no shared top offset for page content.
- Fix: `apps/web/src/app/(public)/layout.tsx` now applies `pt-[4.25rem]` to the public content wrapper. This covers the `h-17` desktop/mobile header centrally for post, organization, blog, event, gallery, medical, donor, and other public detail routes.
- No page-specific `margin-top` patches were added.

## Organization Posts View All

- Homepage Organization Posts / Success History now links to `/post?scope=organization`.
- The public post page reads `scope` from `searchParams`, so direct navigation, refresh, and browser history retain the selected dataset.
- The API applies the organization scope in the database query and requires a non-null organization with active, verified public status.

## Donor Posts View All

- Homepage Donor Posts now links to `/post?scope=donor`.
- The API applies the donor scope in the database query using personal donation post types (`RECAP` and `DONATION`), approved/public visibility, active donor status, and active affiliation to a verified active organization.
- The client no longer refetches an unfiltered list when the server returns a valid empty filtered result.

## Donor Location -> Organization Mapping

- Existing behavior was already server-enforced in `updateMyProfile`.
- The backend validates the selected Upazila and confirms that submitted Division and District IDs belong to the same geographic hierarchy.
- It then derives the District and Division IDs from the validated Upazila, resolves the canonical Upazila organization, and upserts the donor's current affiliation inside the same transaction as the profile update.
- A location change updates the current affiliation and the automatically managed `Normal Donor` membership projection.
- Governance memberships are intentionally separate from ordinary donor affiliation. Existing committee/advisor memberships are not silently moved or deleted during a donor location update, matching the documented business rules.
- Historical donations and posts retain their own organization attribution because those records are not rewritten by the profile update.

## Cache/Data Sync

- Existing Redux mutations invalidate `Posts` and `Analytics` tags for post changes.
- The donor profile mutation remains transactional and returns the refreshed profile after affiliation synchronization.
- Existing organization donor, inventory, and request queries derive current membership/affiliation from the database. No full-page reload was introduced.
- No additional cache invalidation was added because the inspected donor affiliation path does not use a dedicated read-through cache, and the existing post mutation invalidation already covers post lists and analytics.

## Tests

Added `apps/api/test/organizationMappingPostFix.test.ts` with contract checks for:

- deterministic, idempotent Upazila organization seeding
- exactly-one mapping verification and deployed uniqueness protection
- shared fixed-navbar content spacing
- organization and donor View All URL scopes
- database-level post filtering and donor visibility rules
- donor geography validation, organization derivation, atomic affiliation update, and governance separation

Validation status:

- Repository inspection and root-cause tracing completed.
- Prisma schema validation passed.
- The focused contract suite passed all 5 tests.
- `git diff --check` passed; only Windows line-ending notices were reported.
- API typecheck was denied by the execution approval layer. Prisma generation, web typecheck, live migration status, seed execution, lint, builds, and browser checks were not completed, so their results remain unverified in this session.

## Remaining Blockers

- Run the remaining validation in an environment with the configured PostgreSQL `DATABASE_URL` and command approval:
  - Prisma generate and migration status
  - canonical seed twice
  - database count and duplicate/orphan reconciliation
  - API/web typecheck, full tests, lint, and builds
  - mobile and desktop browser verification of public detail pages and View All flows
