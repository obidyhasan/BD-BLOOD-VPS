import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) => readFile(path, "utf8");

test("canonical organization hierarchy and affiliation APIs are separate from governance", async () => {
  const routes = await read("src/app/modules/organization/organization.routes.ts");
  const service = await read("src/app/modules/organization/organization.service.ts");
  const client = await read("../web/src/redux/features/organizations/organizationsApi.ts");
  const donorPage = await read("../web/src/components/modules/Organization/Donor/DonorManagePage.tsx");

  assert.match(routes, /\/tree/);
  assert.match(routes, /\/by-upazila\/:upazilaId/);
  assert.match(routes, /\/:organizationId\/donors/);
  assert.match(routes, /orgMemberAccess\("params"\)/);
  assert.match(service, /canonical:\s*true/);
  assert.match(service, /donorOrganizationAffiliation\.findMany/);
  assert.match(client, /OrganizationTreeNode/);
  assert.match(client, /useGetAffiliatedDonorsQuery/);
  assert.match(donorPage, /useGetAffiliatedDonorsQuery/);
  assert.doesNotMatch(donorPage, /useGetPublicDonorsQuery/);
});

test("public organization UI renders canonical hierarchy and strict Upazila resolution", async () => {
  const page = await read("../web/src/components/modules/Organization/AllOrganization/AllOrganization.tsx");
  assert.match(page, /useGetOrganizationTreeQuery/);
  assert.match(page, /useLazyGetCanonicalOrganizationByUpazilaQuery/);
  assert.match(page, /HierarchyNode/);
  assert.match(page, /donorAffiliations/);
  assert.match(page, /governance/);
});

test("donor withdrawal is row locked and reopens donor-found requests", async () => {
  const command = await read("src/app/modules/bloodRequest/bloodRequest.command.service.ts");
  const routes = await read("src/app/modules/bloodRequest/bloodRequest.routes.ts");
  const client = await read("../web/src/redux/features/bloodRequests/bloodRequestsApi.ts");

  const start = command.indexOf("const withdrawAssignment");
  const block = command.slice(start);
  assert.match(block, /FOR UPDATE/);
  assert.match(block, /RequestAssignmentStatus\.ACCEPTED/);
  assert.match(block, /RequestAssignmentStatus\.CANCELLED/);
  assert.match(block, /BloodRequestStatus\.DONOR_FOUND/);
  assert.match(block, /BloodRequestStatus\.PROCESSING/);
  assert.match(routes, /assignments\/:assignmentId\/withdraw/);
  assert.match(client, /withdrawRequestAssignment/);
});

test("donation commands expose verify reject and Admin-only reversal", async () => {
  const routes = await read("src/app/modules/bloodDonation/bloodDonation.routes.ts");
  const service = await read("src/app/modules/bloodDonation/bloodDonation.service.ts");
  const adminPage = await read("../web/src/app/(private)/dashboard/admin/donations/page.tsx");

  assert.match(routes, /\/:id\/verify/);
  assert.match(routes, /\/:id\/reject/);
  assert.match(routes, /\/:id\/reverse/);
  assert.match(routes, /"\/:id\/reverse",\s*auth\(Role\.ADMIN\)/);
  assert.match(service, /const reverseDonation/);
  assert.match(service, /donorAchievement\.deleteMany/);
  assert.match(service, /lastDonationDate/);
  assert.match(service, /BloodRequestStatus\.DONOR_FOUND/);
  assert.match(adminPage, /Verify Donation/);
  assert.match(adminPage, /Reject Evidence/);
  assert.match(adminPage, /Reverse Verification/);
});

test("public request submission is database-idempotent and sends the header", async () => {
  const schema = await read("prisma/schema/schema.prisma");
  const migration = await read(
    "prisma/migrations/20260805023000_public_request_idempotency/migration.sql",
  );
  const service = await read("src/app/modules/bloodRequest/bloodRequest.service.ts");
  const controller = await read("src/app/modules/bloodRequest/bloodRequest.controller.ts");
  const client = await read("../web/src/redux/features/bloodRequests/bloodRequestsApi.ts");
  const form = await read(
    "../web/src/components/modules/Organization/PublicOrganizationProfile/RequestBloodForm.tsx",
  );

  assert.match(schema, /model PublicRequestIdempotency/);
  assert.match(migration, /public_request_idempotency_key_key/);
  assert.match(service, /payloadHash/);
  assert.match(service, /IDEMPOTENCY_KEY_REUSED/);
  assert.match(service, /PrismaClientKnownRequestError/);
  assert.match(controller, /Idempotency-Key/);
  assert.match(client, /headers:\s*\{ "Idempotency-Key": idempotencyKey \}/);
  assert.match(form, /crypto\.randomUUID\(\)/);
});

test("governance category drives independent caps and Upazila advisor policy", async () => {
  const service = await read("src/app/modules/organizationMember/organizationMember.service.ts");
  const validation = await read("src/app/modules/organizationMember/organizationMember.validation.ts");
  const adminPage = await read(
    "../web/src/app/(private)/dashboard/admin/organization-members/page.tsx",
  );

  assert.match(validation, /GovernanceCategory/);
  assert.match(service, /category:\s*GovernanceCategory/);
  assert.match(service, /existing\.category === GovernanceCategory\.ADVISOR/);
  assert.match(service, /organizationId.*category/);
  assert.match(adminPage, /allowedPromotePositions/);
  assert.match(adminPage, /position\.level !== "Support"/);
  assert.match(adminPage, /category: position\?\.level === "Management" \? "ADVISOR" : "COMMITTEE"/);
});

test("durable jobs run in a separately deployable worker without legacy donor dispatch", async () => {
  const server = await read("src/server.ts");
  const worker = await read("src/worker.ts");
  const manifest = await read("package.json");
  const compose = await read("../../docker-compose.yml");
  const reversalService = await read("src/app/modules/bloodDonation/bloodDonation.service.ts");

  assert.doesNotMatch(server, /startNotificationSweeper|startDonorAvailabilitySweeper|startMessageOutboxWorker/);
  assert.match(worker, /processMessageOutbox/);
  assert.match(worker, /sweepDonorAvailability/);
  assert.doesNotMatch(worker, /dispatchBloodRequestDonorAlerts|startNotificationSweeper/);
  assert.match(manifest, /"start:worker"/);
  assert.match(compose, /worker:/);
  assert.match(reversalService, /post\.updateMany/);
});

test("system reconciliation audits all required projections", async () => {
  const audit = await read("src/app/scripts/systemReconciliationAudit.ts");
  const manifest = await read("package.json");

  assert.match(manifest, /"audit:reconciliation"/);
  assert.match(audit, /request_status_assignment_aggregate_mismatches/);
  assert.match(audit, /donor_cooldown_projection_mismatches/);
  assert.match(audit, /affiliation_geography_mismatches/);
  assert.match(audit, /governance_capacity_violations/);
  assert.match(audit, /achievement_unlock_mismatches/);
  assert.match(audit, /process\.exitCode = 2/);
});
