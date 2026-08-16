import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { loadAllMigrationSql } from "./helpers/migrationSql";

const read = (path: string) => readFile(path, "utf8");

test("homepage and organization galleries are isolated and publication-aware", async () => {
  const schema = await read("prisma/schema/schema.prisma");
  const migration = await loadAllMigrationSql();
  const routes = await read("src/app/modules/gallery/gallery.routes.ts");
  const controller = await read("src/app/modules/gallery/gallery.controller.ts");
  const service = await read("src/app/modules/gallery/gallery.service.ts");
  const access = await read("src/app/middlewares/orgAccess.ts");

  assert.match(schema, /isPublished\s+Boolean\s+@default\(true\)/);
  assert.match(schema, /isFeatured\s+Boolean\s+@default\(false\)/);
  assert.match(schema, /sortOrder\s+Int\s+@default\(0\)/);
  assert.match(migration, /galleries_organizationId_isPublished_sortOrder_idx/);
  assert.match(routes, /"\/manage"/);
  assert.match(routes, /auth\(Role\.ADMIN, Role\.DONOR\)/);
  assert.match(controller, /assertCanManageGallery/);
  assert.match(
    service,
    /management \? \{\} : \{ isPublished: true, approvalStatus: ApprovalStatus\.APPROVED \}/,
  );
  assert.match(service, /filters\.scope === "homepage"/);
  assert.match(service, /organizationId: filters\.organizationId/);
  assert.match(access, /Only an Admin can manage Homepage Gallery items/);
  assert.match(access, /getActiveMembership\(user\.email, targetOrgId\)/);
});

test("organization blog authoring is scoped and Admin moderated while public reads stay approved", async () => {
  const routes = await read("src/app/modules/blog/blog.routes.ts");
  const service = await read("src/app/modules/blog/blog.service.ts");

  assert.match(routes, /auth\(Role\.ADMIN, Role\.DONOR\)/);
  assert.match(routes, /"\/manage"/);
  assert.match(service, /assertCanAccessOrganizationDashboard/);
  assert.match(service, /organizationId: payload\.organizationId/);
  assert.match(service, /status: user\.role === "ADMIN" \? existing\.status : BlogStatus\.PENDING/);
  assert.match(service, /status: BlogStatus\.APPROVED/);
});

test("governance appointments use existing verified donors and unique scoped position seats", async () => {
  const schema = await read("prisma/schema/schema.prisma");
  const migration = await loadAllMigrationSql();
  const service = await read(
    "src/app/modules/organizationMember/organizationMember.service.ts",
  );

  assert.match(schema, /seatKey\s+String\?\s+@unique/);
  assert.match(migration, /OrganizationMembers_seatKey_key/);
  assert.match(service, /donor\.isVerified/);
  assert.match(service, /donor\.accountStatus !== AccountStatus\.ACTIVE/);
  assert.match(service, /governanceSeatKey/);
  assert.match(service, /appointedById: appointingDonor\.id/);
  assert.match(service, /error\.code === "P2002"/);
  assert.match(service, /seatKey: null/);
});

test("Admin controls national division and district governance while Upazila self-management remains scoped", async () => {
  const service = await read(
    "src/app/modules/organizationMember/organizationMember.service.ts",
  );
  const positionValidation = await read(
    "src/app/modules/organizationPosition/organizationPosition.validation.ts",
  );
  const positionService = await read(
    "src/app/modules/organizationPosition/organizationPosition.service.ts",
  );
  const publicDirectory = await read(
    "../web/src/components/modules/Organization/AllOrganization/AllOrganization.tsx",
  );

  assert.match(
    service,
    /Only an Admin can manage National, Division, and District governance assignments/,
  );
  assert.match(service, /organization\?\.level !== "UPAZILA"/);
  assert.match(service, /do not permit Advisor appointments/);
  assert.match(service, /take: LEADERSHIP_MEMBER_CAP/);
  assert.match(service, /positionOrder: "asc"/);
  assert.match(service, /Only an Admin can move or reassign an existing governance member/);
  assert.match(positionValidation, /PositionLevel/);
  assert.match(positionValidation, /PositionStatus/);
  assert.match(positionService, /Organization position already exists/);
  assert.match(positionService, /Cannot delete a position while it has active occupants/);
  assert.match(publicDirectory, /divisionId: divisionId \|\| undefined/);
  assert.match(publicDirectory, /districtId: districtId \|\| undefined/);
  assert.match(publicDirectory, /handleUpazilaSelect/);
  assert.match(publicDirectory, /router\.push\(`\/organization\/\$\{org\.id\}`\)/);
});

test("organization public profiles render only organization-scoped public gallery queries", async () => {
  const profile = await read(
    "../web/src/components/modules/Organization/PublicOrganizationProfile/PublicOrganizationProfile.tsx",
  );
  const client = await read(
    "../web/src/redux/features/gallery/galleryApi.ts",
  );

  assert.match(profile, /useGetAllGalleriesQuery/);
  assert.match(profile, /organizationId: organization\?\.id/);
  assert.match(profile, /Organization <span className="text-primary">Gallery<\/span>/);
  assert.match(client, /url: `\/galleries\/manage/);
  assert.match(client, /useGetManagedGalleriesQuery/);
});
