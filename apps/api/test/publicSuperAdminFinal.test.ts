import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) => readFile(path, "utf8");

test("public organization directory is leadership-only and uses governance category", async () => {
  const page = await read("../web/src/components/modules/Organization/AllOrganization/AllOrganization.tsx");
  const service = await read("src/app/modules/organizationMember/organizationMember.service.ts");
  const controller = await read("src/app/modules/organizationMember/organizationMember.controller.ts");

  assert.match(page, /Committee/);
  assert.match(page, /Advisors/);
  assert.match(page, /divisionId: divisionId \|\| undefined/);
  assert.match(page, /districtId: districtId \|\| undefined/);
  assert.match(page, /setDistrictId\(""\)/);
  assert.match(page, /setUpazilaId\(""\)/);
  assert.match(page, /router\.push\(`\/organization\/\$\{result\.data\.id\}`\)/);
  assert.doesNotMatch(page, /Regional Partners|Notice Board|Top Members|OrganizationCard/);
  assert.match(service, /category: scope\.category/);
  assert.doesNotMatch(service.slice(service.indexOf("const getPublicLeadershipMembers"), service.indexOf("const getPublicOrganizationMembers")), /positionStatus: PositionStatus\.ACTIVE/);
  assert.match(controller, /GovernanceCategory\.ADVISOR/);
});

test("admin has one Overview, grouped ownership, and a connected organization approval queue", async () => {
  const sidebar = await read("../web/src/components/ui/admin-sidebar.tsx");
  const overview = await read("../web/src/app/(private)/dashboard/admin/page.tsx");
  const legacyAnalytics = await read("../web/src/app/(private)/dashboard/admin/analytics/page.tsx");
  const approvals = await read("../web/src/app/(private)/dashboard/admin/organization-approvals/page.tsx");

  assert.match(sidebar, /title: "Overview"/);
  assert.doesNotMatch(sidebar, /title: "Dashboard"|title: "Analytics"/);
  assert.match(sidebar, /Donor Management/);
  assert.match(sidebar, /Organization Management/);
  assert.match(sidebar, /Approval Queue/);
  assert.match(sidebar, /Medical/);
  assert.match(sidebar, /Content/);
  assert.match(sidebar, /System/);
  assert.match(overview, /AuditLogSection/);
  assert.match(legacyAnalytics, /redirect\("\/dashboard\/admin"\)/);
  assert.match(approvals, /useUpdateBlogStatusMutation/);
  assert.match(approvals, /useUpdateEventApprovalMutation/);
  assert.match(approvals, /useUpdateGalleryApprovalMutation/);
  assert.match(approvals, /organizationId/);
  assert.match(approvals, /\.unwrap\(\)/);
});

test("all admin authentication entry points land on consolidated Overview", async () => {
  const proxy = await read("../web/src/proxy.ts");
  const login = await read("../web/src/components/modules/Auth/Login/LoginForm.tsx");
  const google = await read("../web/src/app/(auth)/auth/google/callback/GoogleCallbackClient.tsx");
  for (const source of [proxy, login, google]) assert.doesNotMatch(source, /\/dashboard\/admin\/analytics/);
});

test("medical institution admin fields match persisted and public data", async () => {
  const service = await read("src/app/modules/medicalInstitution/medicalInstitution.service.ts");
  const modal = await read("../web/src/components/modules/Admin/Medical/UploadInstitutionModal.tsx");
  const mapper = await read("../web/src/lib/medical.ts");
  const details = await read("../web/src/components/modules/Medical/MedicalDetailsPage.tsx");

  assert.match(service, /doctors:/);
  assert.match(service, /upazila:/);
  assert.match(modal, /address: z\.string\(\)\.min/);
  assert.doesNotMatch(modal, /doctorsCount|departments|emergencyServices/);
  assert.match(mapper, /specialists: \(inst\.doctors \?\? \[\]\)\.map/);
  assert.doesNotMatch(details, /Dr\. Farhana Islam|Dr\. Mahmud Hasan|Emergency Services/);
});

test("achievement mutations enforce unique thresholds and reconcile donor unlocks", async () => {
  const service = await read("src/app/modules/achievement/achievement.service.ts");

  assert.match(service, /assertUniqueThreshold/);
  assert.match(service, /reconcileAchievement/);
  assert.match(service, /AchievementThresholdType\.VERIFIED_DONATIONS/);
  assert.match(service, /verificationStatus: "VERIFIED"/);
  assert.match(service, /donorAchievement\.deleteMany/);
  assert.match(service, /donorAchievement\.createMany/);
  assert.match(service, /prisma\.\$transaction/);
});
