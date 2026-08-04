import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) => readFile(path, "utf8");

test("public request creation uses canonical routing and does not dispatch donors", async () => {
  const service = await read("src/app/modules/bloodRequest/bloodRequest.service.ts");
  const createStart = service.indexOf("const createRequest");
  const createEnd = service.indexOf("const getManagedOrganizationIds");
  const createBlock = service.slice(createStart, createEnd);

  assert.match(createBlock, /canonical:\s*true/);
  assert.match(createBlock, /status:\s*"SUBMITTED"/);
  assert.match(createBlock, /handledByOrganizationId:\s*organization\.id/);
  assert.doesNotMatch(createBlock, /dispatchBloodRequestDonorAlerts/);
  assert.doesNotMatch(createBlock, /sendSMS\(/);
});

test("command routes expose explicit lifecycle operations and protect management reads", async () => {
  const routes = await read("src/app/modules/bloodRequest/bloodRequest.routes.ts");

  assert.match(routes, /"\/:id\/start-processing"/);
  assert.match(routes, /"\/:id\/reject"/);
  assert.match(routes, /"\/:id\/complete-handover"/);
  assert.match(routes, /router\.get\(\s*"\/",\s*auth\(Role\.ADMIN, Role\.DONOR\)/s);
  assert.match(routes, /router\.get\(\s*"\/:id",\s*auth\(Role\.ADMIN, Role\.DONOR\)/s);
});

test("donor commitments use modern states and request row locks", async () => {
  const commandService = await read(
    "src/app/modules/bloodRequest/bloodRequest.command.service.ts",
  );
  const requestService = await read(
    "src/app/modules/bloodRequest/bloodRequest.service.ts",
  );

  assert.match(commandService, /FOR UPDATE/);
  assert.match(commandService, /assertRequestCapacity\(/);
  assert.match(commandService, /RequestAssignmentStatus\.EXPIRED/);
  assert.match(requestService, /status:\s*RequestAssignmentStatus\.NOTIFIED/);
  assert.match(requestService, /profileStatus:\s*"COMPLETE"/);
});

test("verified linked donations derive fulfillment and enqueue durable requester SMS", async () => {
  const donationService = await read(
    "src/app/modules/bloodDonation/bloodDonation.service.ts",
  );

  assert.match(donationService, /RequestAssignmentStatus\.DONATION_PENDING/);
  assert.match(donationService, /RequestAssignmentStatus\.DONATED/);
  assert.match(donationService, /BloodRequestStatus\.FULFILLED/);
  assert.match(donationService, /BLOOD_REQUEST_FULFILLED_REQUESTER/);
  assert.match(donationService, /DONATION_REVERSAL_REQUIRED/);
});

test("legacy organization rematch is disabled", async () => {
  const service = await read("src/app/modules/bloodRequest/bloodRequest.service.ts");
  assert.match(service, /LEGACY_REMATCH_DISABLED/);
});
