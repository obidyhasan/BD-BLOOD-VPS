import { BloodRequestStatus, RequestAssignmentStatus } from "@prisma/client";

export type TransitionConflictCode =
  | "PROFILE_INCOMPLETE"
  | "EMAIL_NOT_VERIFIED"
  | "DONOR_NOT_ELIGIBLE"
  | "ASSIGNMENT_NOT_ACTIONABLE"
  | "REQUEST_CAPACITY_REACHED"
  | "REQUEST_CLOSED"
  | "INVALID_REQUEST_TRANSITION"
  | "HANDOVER_NOT_READY";

export class TransitionConflict extends Error {
  readonly code: TransitionConflictCode;
  readonly errorCode: TransitionConflictCode;
  readonly statusCode = 409;

  constructor(code: TransitionConflictCode, message: string) {
    super(message);
    this.name = "TransitionConflict";
    this.code = code;
    this.errorCode = code;
  }
}

const activeRequestStatuses = new Set<BloodRequestStatus>([
  BloodRequestStatus.SUBMITTED,
  BloodRequestStatus.PROCESSING,
  BloodRequestStatus.DONOR_FOUND,
]);

export const assertRequestIsActive = (status: BloodRequestStatus) => {
  if (!activeRequestStatuses.has(status)) {
    throw new TransitionConflict(
      "REQUEST_CLOSED",
      "This blood request is no longer accepting operational changes.",
    );
  }
};

export const assertRequestTransition = (
  current: BloodRequestStatus,
  next: BloodRequestStatus,
) => {
  const allowed: Record<BloodRequestStatus, BloodRequestStatus[]> = {
    PENDING: [BloodRequestStatus.SUBMITTED, BloodRequestStatus.CANCELLED],
    SUBMITTED: [
      BloodRequestStatus.PROCESSING,
      BloodRequestStatus.REJECTED,
      BloodRequestStatus.CANCELLED,
    ],
    PROCESSING: [
      BloodRequestStatus.DONOR_FOUND,
      BloodRequestStatus.CANCELLED,
    ],
    DONOR_FOUND: [
      BloodRequestStatus.PROCESSING,
      BloodRequestStatus.FULFILLED,
      BloodRequestStatus.CANCELLED,
    ],
    FULFILLED: [BloodRequestStatus.COMPLETED],
    COMPLETED: [],
    CANCELLED: [],
    REJECTED: [],
  };

  if (current === next || allowed[current].includes(next)) return;
  throw new TransitionConflict(
    "INVALID_REQUEST_TRANSITION",
    `Request cannot transition from ${current} to ${next}.`,
  );
};

export const assertAssignmentActionable = (
  requestStatus: BloodRequestStatus,
  assignmentStatus: RequestAssignmentStatus,
) => {
  if (
    requestStatus !== BloodRequestStatus.PROCESSING ||
    assignmentStatus !== RequestAssignmentStatus.NOTIFIED
  ) {
    throw new TransitionConflict(
      "ASSIGNMENT_NOT_ACTIONABLE",
      "This donor assignment is no longer actionable.",
    );
  }
};

export const assertRequestCapacity = (
  committedUnits: number,
  requiredUnits: number,
) => {
  if (committedUnits >= requiredUnits) {
    throw new TransitionConflict(
      "REQUEST_CAPACITY_REACHED",
      "All required donor commitments have already been received.",
    );
  }
};

export const assertHandoverReady = (
  requestStatus: BloodRequestStatus,
  verifiedUnits: number,
  requiredUnits: number,
) => {
  if (
    requestStatus !== BloodRequestStatus.FULFILLED ||
    verifiedUnits < requiredUnits
  ) {
    throw new TransitionConflict(
      "HANDOVER_NOT_READY",
      "Hand-over requires all requested bags to have verified donations.",
    );
  }
};
