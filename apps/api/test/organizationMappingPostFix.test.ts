import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const apiRoot = path.resolve(__dirname, "..");
const webRoot = path.resolve(apiRoot, "../web/src");

const readApi = (relativePath: string) =>
  readFile(path.join(apiRoot, relativePath), "utf8");
const readWeb = (relativePath: string) =>
  readFile(path.join(webRoot, relativePath), "utf8");

test("canonical Upazila organizations are derived, idempotent, unique, and verified after seed", async () => {
  const [seed, migration] = await Promise.all([
    readApi("src/app/seed/organizationSeed.ts"),
    readApi("prisma/migrations/20260814143000_audit_integrity/migration.sql"),
  ]);

  assert.match(seed, /for \(const upazila of district\.upazilas\)/);
  assert.match(seed, /name: `\$\{upazila\.name\} Upazila Organization`/);
  assert.match(seed, /deterministicUuid\(`UPAZILA:\$\{upazila\.id\}`\)/);
  assert.match(seed, /if \(existingUpazilaIds\.has\(upazila\.id\)\) continue/);
  assert.match(seed, /rows\.length !== 1/);
  assert.match(seed, /organization\?\.districtId !== upazila\.districtId/);
  assert.match(seed, /Canonical Upazila organization verification failed/);
  assert.match(
    migration,
    /CREATE UNIQUE INDEX "organizations_active_upazila_key"[\s\S]*?WHERE "level" = 'UPAZILA' AND "isDeleted" = false/,
  );
});

test("the fixed public navbar has one shared content offset", async () => {
  const [navbar, layout] = await Promise.all([
    readWeb("components/shared/Navbar/Navbar.tsx"),
    readWeb("app/(public)/layout.tsx"),
  ]);

  assert.match(navbar, /<header className="fixed top-0 left-0 right-0/);
  assert.match(navbar, /w-full h-17 flex items-center/);
  assert.match(layout, /pt-\[4\.25rem\]/);
});

test("homepage View All links preserve organization and donor scopes in the URL", async () => {
  const [organizationSection, donorSection, postPage, postFeed] =
    await Promise.all([
      readWeb("components/modules/Home/OurWork/OurWork.tsx"),
      readWeb("components/modules/Home/CommitteeSection/CommitteeSection.tsx"),
      readWeb("app/(public)/post/page.tsx"),
      readWeb("components/modules/Post/PostFeed.tsx"),
    ]);

  assert.match(organizationSection, /href: "\/post\?scope=organization"/);
  assert.match(donorSection, /href: "\/post\?scope=donor"/);
  assert.match(postPage, /params\.scope/);
  assert.match(
    postPage,
    /postScope:\s*scope === "organization" \|\| scope === "donor"/,
  );
  assert.match(postFeed, /skip: initialData !== undefined/);
});

test("public post scopes are filtered by Prisma rather than in browser state", async () => {
  const [constant, service] = await Promise.all([
    readApi("src/app/modules/post/post.constant.ts"),
    readApi("src/app/modules/post/post.service.ts"),
  ]);

  assert.match(constant, /"postScope"/);
  assert.match(service, /postScope === "organization"/);
  assert.match(service, /organization: activePublicOrganizationWhere/);
  assert.match(service, /postType: \{ notIn: PERSONAL_DONATION_POST_TYPES \}/);
  assert.match(service, /postScope === "donor"/);
  assert.match(service, /postType: \{ in: PERSONAL_DONATION_POST_TYPES \}/);
  assert.match(service, /approvalStatus: ApprovalStatus\.APPROVED/);
  assert.match(service, /visibility: PostVisibility\.PUBLIC/);
  assert.match(service, /affiliations:[\s\S]*?some:[\s\S]*?active: true/);
});

test("donor location updates validate ancestry and atomically derive current affiliation", async () => {
  const [userService, workflow] = await Promise.all([
    readApi("src/app/modules/user/user.service.ts"),
    readFile(path.resolve(apiRoot, "../../docs/BD_BILAR_WORKFLOW.md"), "utf8"),
  ]);

  assert.match(userService, /District does not belong to the selected Upazila/);
  assert.match(
    userService,
    /Division does not belong to the selected District/,
  );
  assert.match(userService, /nextData\.districtId = upazila\.districtId/);
  assert.match(
    userService,
    /nextData\.divisionId = upazila\.district\.divisionId/,
  );
  assert.match(userService, /resolveUpazilaOrganization\(tx, upazila\.id\)/);
  assert.match(userService, /upsertDonorAffiliation\(tx/);
  assert.match(userService, /if \(existingMembership && !isAutoMembership\)/);
  assert.match(
    userService,
    /await syncDonorOrganizationMembership\(tx, userInfo\.id, targetUpazilaId\)/,
  );
  assert.match(
    workflow,
    /governance membership represents committee responsibility and is not ordinary donor affiliation/i,
  );
});
