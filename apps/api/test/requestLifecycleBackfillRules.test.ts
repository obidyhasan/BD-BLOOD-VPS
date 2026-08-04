import assert from "node:assert/strict";
import test from "node:test";
import {
  BloodRequestStatus,
  RequestAssignmentStatus,
} from "@prisma/client";
import {
  assignmentCountsAsCommitted,
  findUnambiguousDonationAssignment,
  normalizeAssignmentStatus,
  normalizeRequestStatus,
} from "../src/app/shared/requestLifecycleBackfillRules";

test("normalizes legacy assignment states without changing accepted assignments", () => {
  assert.equal(
    normalizeAssignmentStatus(RequestAssignmentStatus.PENDING),
    RequestAssignmentStatus.NOTIFIED,
  );
  assert.equal(
    normalizeAssignmentStatus(RequestAssignmentStatus.REJECTED),
    RequestAssignmentStatus.DECLINED,
  );
  assert.equal(
    normalizeAssignmentStatus(RequestAssignmentStatus.ACCEPTED),
    RequestAssignmentStatus.ACCEPTED,
  );
});

test("normalizes request lifecycle from verified donations before commitments", () => {
  assert.equal(
    normalizeRequestStatus({
      currentStatus: BloodRequestStatus.FULFILLED,
      requiredUnits: 3,
      committedUnits: 3,
      verifiedLinkedUnits: 2,
      hasDispatchEvidence: true,
    }),
    BloodRequestStatus.DONOR_FOUND,
  );
  assert.equal(
    normalizeRequestStatus({
      currentStatus: BloodRequestStatus.PROCESSING,
      requiredUnits: 3,
      committedUnits: 3,
      verifiedLinkedUnits: 3,
      hasDispatchEvidence: true,
    }),
    BloodRequestStatus.FULFILLED,
  );
});

test("legacy pending requests use dispatch evidence conservatively", () => {
  const base = {
    currentStatus: BloodRequestStatus.PENDING,
    requiredUnits: 1,
    committedUnits: 0,
    verifiedLinkedUnits: 0,
  };

  assert.equal(
    normalizeRequestStatus({ ...base, hasDispatchEvidence: false }),
    BloodRequestStatus.SUBMITTED,
  );
  assert.equal(
    normalizeRequestStatus({ ...base, hasDispatchEvidence: true }),
    BloodRequestStatus.PROCESSING,
  );
});

test("committed assignment states include accepted and donation progression", () => {
  assert.equal(assignmentCountsAsCommitted(RequestAssignmentStatus.NOTIFIED), false);
  assert.equal(assignmentCountsAsCommitted(RequestAssignmentStatus.ACCEPTED), true);
  assert.equal(
    assignmentCountsAsCommitted(RequestAssignmentStatus.DONATION_PENDING),
    true,
  );
  assert.equal(assignmentCountsAsCommitted(RequestAssignmentStatus.DONATED), true);
});

test("links a donation only when exactly one assignment matches", () => {
  const donation = {
    donorId: "donor-1",
    hospitalName: "Dhaka Medical",
    divisionId: "division-1",
    districtId: "district-1",
    upazilaId: "upazila-1",
    donationDate: new Date("2026-08-02T00:00:00Z"),
  };
  const candidate = {
    assignmentId: "assignment-1",
    donorId: "donor-1",
    assignedAt: new Date("2026-08-01T00:00:00Z"),
    request: {
      hospitalName: "dhaka medical",
      divisionId: "division-1",
      districtId: "district-1",
      upazilaId: "upazila-1",
    },
  };

  assert.equal(
    findUnambiguousDonationAssignment(donation, [candidate])?.assignmentId,
    "assignment-1",
  );
  assert.equal(
    findUnambiguousDonationAssignment(donation, [
      candidate,
      { ...candidate, assignmentId: "assignment-2" },
    ]),
    null,
  );
});
