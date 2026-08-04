import httpStatus from "http-status";
import {
  BloodRequestStatus,
  DonorProfileStatus,
  RequestAssignmentStatus,
  VerificationStatus,
} from "@prisma/client";
import ApiError from "../../errors/ApiError";
import { assertCanUpdateBloodRequest } from "../../middlewares/orgAccess";
import { IJWTPayload } from "../../types";
import { prisma } from "../../shared/prisma";
import {
  assertAssignmentActionable,
  assertHandoverReady,
  assertRequestCapacity,
  assertRequestTransition,
  TransitionConflict,
} from "../../shared/requestTransitionRules";

const getActor = async (user: IJWTPayload) => {
  const donor = await prisma.donor.findUnique({
    where: { email: user.email, isDeleted: false },
    select: { id: true },
  });
  if (!donor) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  return donor;
};

const addHistory = (
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  data: {
    requestId: string;
    previousStatus: BloodRequestStatus;
    newStatus: BloodRequestStatus;
    changedById: string;
    reason: string;
  },
) => tx.bloodRequestStatusHistory.create({ data });

const startProcessing = async (user: IJWTPayload, requestId: string) => {
  await assertCanUpdateBloodRequest(user, requestId);
  const actor = await getActor(user);

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "BloodRequests" WHERE id = ${requestId} FOR UPDATE`;
    const request = await tx.bloodRequest.findUnique({
      where: { id: requestId, isDeleted: false },
    });
    if (!request) throw new ApiError(httpStatus.NOT_FOUND, "Blood request not found!");
    if (request.status === BloodRequestStatus.PROCESSING) return request;
    assertRequestTransition(request.status, BloodRequestStatus.PROCESSING);

    const updated = await tx.bloodRequest.update({
      where: { id: requestId },
      data: {
        status: BloodRequestStatus.PROCESSING,
        acceptedById: actor.id,
        acceptedAt: request.acceptedAt ?? new Date(),
        version: { increment: 1 },
      },
    });
    await addHistory(tx, {
      requestId,
      previousStatus: request.status,
      newStatus: BloodRequestStatus.PROCESSING,
      changedById: actor.id,
      reason: "Organization started processing",
    });
    return updated;
  });
};

const rejectRequest = async (
  user: IJWTPayload,
  requestId: string,
  reason: string,
) => {
  await assertCanUpdateBloodRequest(user, requestId);
  const actor = await getActor(user);

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "BloodRequests" WHERE id = ${requestId} FOR UPDATE`;
    const request = await tx.bloodRequest.findUnique({
      where: { id: requestId, isDeleted: false },
    });
    if (!request) throw new ApiError(httpStatus.NOT_FOUND, "Blood request not found!");
    if (request.status === BloodRequestStatus.REJECTED) return request;
    assertRequestTransition(request.status, BloodRequestStatus.REJECTED);

    const updated = await tx.bloodRequest.update({
      where: { id: requestId },
      data: {
        status: BloodRequestStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedById: actor.id,
        rejectionReason: reason,
        version: { increment: 1 },
      },
    });
    await addHistory(tx, {
      requestId,
      previousStatus: request.status,
      newStatus: BloodRequestStatus.REJECTED,
      changedById: actor.id,
      reason,
    });
    return updated;
  });
};

const cancelRequest = async (
  user: IJWTPayload,
  requestId: string,
  reason: string,
) => {
  await assertCanUpdateBloodRequest(user, requestId);
  const actor = await getActor(user);

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "BloodRequests" WHERE id = ${requestId} FOR UPDATE`;
    const request = await tx.bloodRequest.findUnique({
      where: { id: requestId, isDeleted: false },
    });
    if (!request) throw new ApiError(httpStatus.NOT_FOUND, "Blood request not found!");
    if (request.status === BloodRequestStatus.CANCELLED) return request;
    assertRequestTransition(request.status, BloodRequestStatus.CANCELLED);

    await tx.requestAssignment.updateMany({
      where: {
        requestId,
        isDeleted: false,
        status: {
          in: [RequestAssignmentStatus.NOTIFIED, RequestAssignmentStatus.ACCEPTED],
        },
      },
      data: { status: RequestAssignmentStatus.CANCELLED, cancelledAt: new Date() },
    });
    const updated = await tx.bloodRequest.update({
      where: { id: requestId },
      data: {
        status: BloodRequestStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledById: actor.id,
        cancellationReason: reason,
        version: { increment: 1 },
      },
    });
    await addHistory(tx, {
      requestId,
      previousStatus: request.status,
      newStatus: BloodRequestStatus.CANCELLED,
      changedById: actor.id,
      reason,
    });
    return updated;
  });
};

const completeHandover = async (user: IJWTPayload, requestId: string) => {
  await assertCanUpdateBloodRequest(user, requestId);
  const actor = await getActor(user);

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "BloodRequests" WHERE id = ${requestId} FOR UPDATE`;
    const request = await tx.bloodRequest.findUnique({
      where: { id: requestId, isDeleted: false },
      include: {
        assignments: {
          where: {
            isDeleted: false,
            donation: { verificationStatus: VerificationStatus.VERIFIED },
          },
          select: { bagUnits: true },
        },
      },
    });
    if (!request) throw new ApiError(httpStatus.NOT_FOUND, "Blood request not found!");
    if (request.status === BloodRequestStatus.COMPLETED) return request;
    const verifiedUnits = request.assignments.reduce(
      (total, assignment) => total + assignment.bagUnits,
      0,
    );
    assertHandoverReady(request.status, verifiedUnits, request.requiredUnits);

    const updated = await tx.bloodRequest.update({
      where: { id: requestId },
      data: {
        status: BloodRequestStatus.COMPLETED,
        handoverCompletedAt: new Date(),
        completedById: actor.id,
        version: { increment: 1 },
      },
    });
    await addHistory(tx, {
      requestId,
      previousStatus: request.status,
      newStatus: BloodRequestStatus.COMPLETED,
      changedById: actor.id,
      reason: "Blood hand-over confirmed",
    });
    return updated;
  });
};

const respondToAssignment = async (
  user: IJWTPayload,
  assignmentId: string,
  action: "ACCEPT" | "DECLINE",
  reason?: string,
) => {
  const donor = await prisma.donor.findUnique({
    where: { email: user.email, isDeleted: false },
    select: {
      id: true,
      isVerified: true,
      profileStatus: true,
      accountStatus: true,
      availabilityStatus: true,
      nextEligibleDonationDate: true,
    },
  });
  if (!donor) throw new ApiError(httpStatus.NOT_FOUND, "Donor not found!");
  if (action === "ACCEPT") {
    if (!donor.isVerified) {
      throw new TransitionConflict("EMAIL_NOT_VERIFIED", "Verify your email before accepting requests.");
    }
    if (donor.profileStatus !== DonorProfileStatus.COMPLETE) {
      throw new TransitionConflict("PROFILE_INCOMPLETE", "Complete your donor profile before accepting requests.");
    }
    if (
      donor.accountStatus !== "ACTIVE" ||
      donor.availabilityStatus !== "AVAILABLE" ||
      (donor.nextEligibleDonationDate && donor.nextEligibleDonationDate > new Date())
    ) {
      throw new TransitionConflict("DONOR_NOT_ELIGIBLE", "You are not currently eligible to donate.");
    }
  }

  return prisma.$transaction(async (tx) => {
    const assignmentRef = await tx.requestAssignment.findFirst({
      where: { id: assignmentId, donorId: donor.id, isDeleted: false },
      select: { requestId: true },
    });
    if (!assignmentRef) throw new ApiError(httpStatus.NOT_FOUND, "Assignment not found!");

    await tx.$queryRaw`SELECT id FROM "BloodRequests" WHERE id = ${assignmentRef.requestId} FOR UPDATE`;
    const assignment = await tx.requestAssignment.findFirst({
      where: { id: assignmentId, donorId: donor.id, isDeleted: false },
      include: { request: true },
    });
    if (!assignment) throw new ApiError(httpStatus.NOT_FOUND, "Assignment not found!");
    assertAssignmentActionable(assignment.request.status, assignment.status);

    if (action === "DECLINE") {
      return tx.requestAssignment.update({
        where: { id: assignmentId },
        data: {
          status: RequestAssignmentStatus.DECLINED,
          declinedAt: new Date(),
          declineReason: reason,
        },
      });
    }

    const committed = await tx.requestAssignment.aggregate({
      where: {
        requestId: assignment.requestId,
        isDeleted: false,
        status: {
          in: [
            RequestAssignmentStatus.ACCEPTED,
            RequestAssignmentStatus.DONATION_PENDING,
            RequestAssignmentStatus.DONATED,
          ],
        },
      },
      _sum: { bagUnits: true },
    });
    assertRequestCapacity(committed._sum.bagUnits ?? 0, assignment.request.requiredUnits);

    const updated = await tx.requestAssignment.update({
      where: { id: assignmentId },
      data: { status: RequestAssignmentStatus.ACCEPTED, acceptedAt: new Date() },
    });
    const after = (committed._sum.bagUnits ?? 0) + updated.bagUnits;

    if (after >= assignment.request.requiredUnits) {
      const expired = await tx.requestAssignment.findMany({
        where: {
          requestId: assignment.requestId,
          isDeleted: false,
          status: RequestAssignmentStatus.NOTIFIED,
        },
        select: { id: true },
      });
      const expiredIds = expired.map((item) => item.id);
      await tx.requestAssignment.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: RequestAssignmentStatus.EXPIRED, cancelledAt: new Date() },
      });
      if (expiredIds.length) {
        await tx.notification.updateMany({
          where: {
            isDeleted: false,
            relatedType: "REQUEST_ASSIGNMENT",
            relatedId: { in: expiredIds },
          },
          data: { isRead: true },
        });
      }
      await tx.bloodRequest.update({
        where: { id: assignment.requestId },
        data: {
          status: BloodRequestStatus.DONOR_FOUND,
          donorFoundAt: new Date(),
          version: { increment: 1 },
        },
      });
      await addHistory(tx, {
        requestId: assignment.requestId,
        previousStatus: assignment.request.status,
        newStatus: BloodRequestStatus.DONOR_FOUND,
        changedById: donor.id,
        reason: "Required donor commitments reached",
      });
    }

    return updated;
  });
};

export const BloodRequestCommandService = {
  startProcessing,
  rejectRequest,
  cancelRequest,
  completeHandover,
  respondToAssignment,
};
