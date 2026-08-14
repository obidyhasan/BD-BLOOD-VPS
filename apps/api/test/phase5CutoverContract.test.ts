import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderSms } from "../src/app/jobs/messageOutboxWorker";

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

test("request lifecycle writes use command services without arbitrary mutation services", async () => {
  const service = await read("src/app/modules/bloodRequest/bloodRequest.service.ts");
  const controller = await read(
    "src/app/modules/bloodRequest/bloodRequest.controller.ts",
  );

  assert.doesNotMatch(service, /const updateRequestStatus/);
  assert.doesNotMatch(service, /const respondToAssignment/);
  assert.doesNotMatch(service, /const cancelRequest\s*=/);
  assert.doesNotMatch(service, /smsHelper\.sendSMS/);
  assert.doesNotMatch(controller, /const updateRequestStatus/);
  assert.doesNotMatch(controller, /const deleteRequest/);
});

test("organization access is scoped by authoritative handling organization", async () => {
  const access = await read("src/app/middlewares/orgAccess.ts");
  const assertionStart = access.indexOf("export const assertCanUpdateBloodRequest");
  const assertionEnd = access.indexOf("export const assertCanManageInventoryItem");
  const assertionBlock = access.slice(assertionStart, assertionEnd);

  assert.match(assertionBlock, /handledByOrganizationId:\s*\{ in: organizationIds \}/);
  assert.doesNotMatch(assertionBlock, /notifications:/);
});

test("request submission and manual requester messages use durable outbox events", async () => {
  const service = await read("src/app/modules/bloodRequest/bloodRequest.service.ts");

  assert.match(service, /BLOOD_REQUEST_SUBMITTED_ORGANIZATION/);
  assert.match(service, /BLOOD_REQUEST_MANUAL_REQUESTER/);
  assert.match(service, /enqueueOutboxEvent\(tx/);
  assert.doesNotMatch(service, /smsHelper\.sendSMS/);

  const organizationMessage = renderSms("BLOOD_REQUEST_SUBMITTED_ORGANIZATION", {
    referenceCode: "BR-2001",
    bloodGroup: "O-",
    requiredBags: 2,
    requesterName: "Requester",
    hospitalName: "Hospital",
    upazila: "Fakirhat",
  });
  assert.match(organizationMessage, /BR-2001/);
  assert.match(organizationMessage, /O-/);
  assert.match(organizationMessage, /2 bag/);

  const manualMessage = renderSms("BLOOD_REQUEST_MANUAL_REQUESTER", {
    referenceCode: "BR-2001",
    message: "Please keep your phone available.",
  });
  assert.match(manualMessage, /BR-2001/);
  assert.match(manualMessage, /keep your phone available/);
});

test("legacy organization rematch implementation is removed", async () => {
  const service = await read("src/app/modules/bloodRequest/bloodRequest.service.ts");
  assert.doesNotMatch(service, /rematchOrganizations|LEGACY_REMATCH_DISABLED/);
});

test("assignment acceptance revalidates matching affiliation and blood group under the request lock", async () => {
  const commandService = await read(
    "src/app/modules/bloodRequest/bloodRequest.command.service.ts",
  );

  const lockIndex = commandService.indexOf("FOR UPDATE");
  const readinessCommentIndex = commandService.indexOf(
    "Re-read readiness inside the request transaction",
  );
  assert.ok(lockIndex >= 0 && readinessCommentIndex > lockIndex);
  assert.match(commandService, /bloodGroupId !== assignment\.request\.bloodGroupId/);
  assert.match(commandService, /organizationId: assignment\.request\.handledByOrganizationId/);
  assert.match(commandService, /upazilaId: assignment\.request\.upazilaId/);
});

test("cancelling a request disables pending donation submissions", async () => {
  const commandService = await read(
    "src/app/modules/bloodRequest/bloodRequest.command.service.ts",
  );
  const cancelStart = commandService.indexOf("const cancelRequest");
  const cancelEnd = commandService.indexOf("const completeHandover");
  const cancelBlock = commandService.slice(cancelStart, cancelEnd);

  assert.match(cancelBlock, /RequestAssignmentStatus\.NOTIFIED/);
  assert.match(cancelBlock, /RequestAssignmentStatus\.ACCEPTED/);
  assert.match(cancelBlock, /RequestAssignmentStatus\.DONATION_PENDING/);
});

test("fulfilled requester SMS contains progress, location, request and contact details", () => {
  const message = renderSms("BLOOD_REQUEST_FULFILLED_REQUESTER", {
    referenceCode: "BR-1001",
    bloodGroup: "A+",
    requiredBags: 3,
    fulfilledBags: 3,
    division: "Khulna",
    district: "Bagerhat",
    upazila: "Fakirhat",
    hospitalName: "Fakirhat Hospital",
    patientInformation: "Emergency surgery",
    representativeName: "Fakirhat Blood Organization",
    representativePhone: "01700000000",
  });

  for (const expected of [
    "BR-1001",
    "A+",
    "3/3",
    "Fakirhat",
    "Bagerhat",
    "Khulna",
    "Fakirhat Hospital",
    "Emergency surgery",
    "Fakirhat Blood Organization",
    "01700000000",
  ]) {
    assert.match(message, new RegExp(expected.replace("+", "\\+")));
  }
});

test("governance assignment and activation serialize capacity checks", async () => {
  const membershipService = await read(
    "src/app/modules/organizationMember/organizationMember.service.ts",
  );

  const lockMatches = membershipService.match(/pg_advisory_xact_lock/g) ?? [];
  assert.ok(lockMatches.length >= 2);
  assert.match(membershipService, /assertLeadershipCapacityAvailable\(/);
  assert.match(membershipService, /do not permit Advisor appointments/);
});
