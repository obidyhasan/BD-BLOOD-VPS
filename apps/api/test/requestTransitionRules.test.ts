import assert from "node:assert/strict";
import test from "node:test";
import {
  BloodRequestStatus,
  RequestAssignmentStatus,
} from "@prisma/client";
import {
  assertAssignmentActionable,
  assertHandoverReady,
  assertRequestCapacity,
  assertRequestTransition,
  TransitionConflict,
} from "../src/app/shared/requestTransitionRules";
import { requestEventKey } from "../src/app/shared/messageOutbox";

test("allows only legal request command transitions", () => {
  assert.doesNotThrow(() =>
    assertRequestTransition(
      BloodRequestStatus.SUBMITTED,
      BloodRequestStatus.PROCESSING,
    ),
  );
  assert.throws(
    () =>
      assertRequestTransition(
        BloodRequestStatus.SUBMITTED,
        BloodRequestStatus.FULFILLED,
      ),
    (error: unknown) =>
      error instanceof TransitionConflict &&
      error.code === "INVALID_REQUEST_TRANSITION" &&
      error.statusCode === 409,
  );
});

test("rejects capacity overflow and non-actionable assignments with stable codes", () => {
  assert.throws(
    () => assertRequestCapacity(3, 3),
    (error: unknown) =>
      error instanceof TransitionConflict &&
      error.code === "REQUEST_CAPACITY_REACHED",
  );
  assert.throws(
    () =>
      assertAssignmentActionable(
        BloodRequestStatus.DONOR_FOUND,
        RequestAssignmentStatus.NOTIFIED,
      ),
    (error: unknown) =>
      error instanceof TransitionConflict &&
      error.code === "ASSIGNMENT_NOT_ACTIONABLE",
  );
});

test("requires verified units before hand-over", () => {
  assert.throws(
    () => assertHandoverReady(BloodRequestStatus.DONOR_FOUND, 2, 3),
    (error: unknown) =>
      error instanceof TransitionConflict && error.code === "HANDOVER_NOT_READY",
  );
  assert.doesNotThrow(() =>
    assertHandoverReady(BloodRequestStatus.FULFILLED, 3, 3),
  );
});

test("outbox event keys are deterministic for idempotent retries", () => {
  assert.equal(
    requestEventKey("request-1", "FULFILLED", "requester"),
    requestEventKey("request-1", "FULFILLED", "requester"),
  );
  assert.notEqual(
    requestEventKey("request-1", "FULFILLED", "requester"),
    requestEventKey("request-1", "DONOR_FOUND", "requester"),
  );
});
