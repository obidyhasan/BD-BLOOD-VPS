import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) => readFile(path, "utf8");

test("legacy blood-request write and rematch routes are removed", async () => {
  const routes = await read("src/app/modules/bloodRequest/bloodRequest.routes.ts");
  const controller = await read("src/app/modules/bloodRequest/bloodRequest.controller.ts");
  const validation = await read("src/app/modules/bloodRequest/bloodRequest.validation.ts");

  assert.doesNotMatch(routes, /\/:id\/status|\/:id\/rematch|\/:id\/cancel["']/);
  assert.doesNotMatch(routes, /router\.delete\(/);
  assert.doesNotMatch(controller, /updateRequestStatus|rematchOrganizations|deleteRequest/);
  assert.doesNotMatch(validation, /updateBloodRequestStatusZodSchema/);
  assert.match(routes, /\/:id\/start-processing/);
  assert.match(routes, /\/:id\/cancel-command/);
  assert.match(routes, /\/:id\/complete-handover/);
});

test("frontend blood-request API no longer exports legacy mutations", async () => {
  const api = await read(
    "../web/src/redux/features/bloodRequests/bloodRequestsApi.ts",
  );

  assert.doesNotMatch(api, /updateBloodRequestStatus|cancelBloodRequest:|rematchOrganizations|deleteBloodRequest/);
  assert.match(api, /startProcessing/);
  assert.match(api, /cancelBloodRequestCommand/);
  assert.match(api, /completeHandover/);
});

test("Phase 7 preflight gates every destructive cleanup boundary", async () => {
  const preflight = await read("src/app/scripts/phase7CleanupPreflight.ts");
  const manifest = await read("package.json");

  assert.match(manifest, /"preflight:phase7"/);
  assert.match(preflight, /normal_donor_memberships_without_active_affiliation/);
  assert.match(preflight, /active_affiliation_location_mismatches/);
  assert.match(preflight, /active_governance_memberships_without_organization/);
  assert.match(preflight, /legacy_pending_blood_requests/);
  assert.match(preflight, /legacy_pending_or_rejected_assignments/);
  assert.match(preflight, /active_canonical_organizations_using_legacy_type/);
  assert.match(preflight, /blood_requests_missing_authoritative_handler/);
  assert.match(preflight, /readyForDestructiveCleanup/);
  assert.match(preflight, /process\.exitCode = 2/);
});

test("destructive schema cleanup remains deferred while compatibility reads and writes exist", async () => {
  const affiliation = await read("src/app/shared/donorAffiliation.ts");
  const userService = await read("src/app/modules/user/user.service.ts");
  const schema = await read("prisma/schema/schema.prisma");

  assert.match(affiliation, /LEGACY_MEMBERSHIP/);
  assert.match(userService, /NORMAL_DONOR_POSITION_NAME/);
  assert.match(schema, /type\s+String\?/);
  assert.match(schema, /organizationId\s+String\?/);
});
