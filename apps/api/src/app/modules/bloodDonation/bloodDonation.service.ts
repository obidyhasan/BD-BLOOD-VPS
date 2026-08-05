import httpStatus from "http-status";
import {
  AccountStatus,
  AchievementThresholdType,
  AvailabilityStatus,
  BloodRequestStatus,
  MessageChannel,
  Prisma,
  RequestAssignmentStatus,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";
import { IJWTPayload } from "../../types";
import { bloodDonationSearchableFields } from "./bloodDonation.constant";
import {
  assertCanAccessOrganizationDashboard,
  assertCanUpdateBloodRequest,
} from "../../middlewares/orgAccess";
import { enqueueOutboxEvent, requestEventKey } from "../../shared/messageOutbox";
import { assertRequestTransition, TransitionConflict } from "../../shared/requestTransitionRules";

const getRequesterDonor = async (user: IJWTPayload) => {
  const donor = await prisma.donor.findUnique({
    where: { email: user.email },
  });

  if (!donor) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }
  if (donor.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User is deleted!");
  }
  if (donor.accountStatus !== AccountStatus.ACTIVE) {
    throw new ApiError(httpStatus.FORBIDDEN, `User is ${donor.accountStatus}`);
  }
  return donor;
};

const createDonation = async (user: IJWTPayload, payload: any) => {
  const donor = await getRequesterDonor(user);
  const donationDate =
    payload.donationDate instanceof Date
      ? payload.donationDate
      : new Date(payload.donationDate);

  if (Number.isNaN(donationDate.getTime())) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid donation date!");
  }

  return prisma.$transaction(async (tx) => {
    let derived = {
      hospitalName: payload.hospitalName,
      divisionId: payload.divisionId,
      districtId: payload.districtId,
      upazilaId: payload.upazilaId,
      organizationId: payload.organizationId,
    };

    if (payload.requestAssignmentId) {
      const assignment = await tx.requestAssignment.findUnique({
        where: { id: payload.requestAssignmentId, isDeleted: false },
        include: { request: true, donation: { select: { id: true } } },
      });
      if (!assignment) {
        throw new ApiError(httpStatus.NOT_FOUND, "Request assignment not found!");
      }
      if (assignment.donorId !== donor.id) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "This request assignment does not belong to you!",
        );
      }
      if (assignment.status !== RequestAssignmentStatus.ACCEPTED) {
        throw new TransitionConflict(
          "ASSIGNMENT_NOT_ACTIONABLE",
          "Donation details can only be submitted for an accepted assignment.",
        );
      }
      if (assignment.donation) {
        throw new ApiError(
          httpStatus.CONFLICT,
          "A donation already exists for this assignment.",
          "",
          "ASSIGNMENT_DONATION_EXISTS",
        );
      }
      if (
        assignment.request.status !== BloodRequestStatus.DONOR_FOUND &&
        assignment.request.status !== BloodRequestStatus.PROCESSING
      ) {
        throw new TransitionConflict(
          "REQUEST_CLOSED",
          "This request no longer accepts donation submissions.",
        );
      }

      derived = {
        hospitalName: assignment.request.hospitalName,
        divisionId: assignment.request.divisionId,
        districtId: assignment.request.districtId,
        upazilaId: assignment.request.upazilaId,
        organizationId: assignment.request.handledByOrganizationId,
      };
    }

    const result = await tx.bloodDonation.create({
      data: {
        donorId: donor.id,
        recipientName: payload.recipientName,
        hospitalName: derived.hospitalName,
        divisionId: derived.divisionId,
        districtId: derived.districtId,
        upazilaId: derived.upazilaId,
        organizationId: derived.organizationId,
        requestAssignmentId: payload.requestAssignmentId,
        donationDate,
        verificationStatus: VerificationStatus.PENDING,
        notes: payload.notes,
      },
      include: {
        donor: {
          omit: { password: true },
          include: { bloodGroup: true },
        },
        organization: true,
        division: true,
        district: true,
        upazila: true,
      },
    });

    if (payload.requestAssignmentId) {
      await tx.requestAssignment.update({
        where: { id: payload.requestAssignmentId },
        data: {
          status: RequestAssignmentStatus.DONATION_PENDING,
          donationSubmittedAt: new Date(),
        },
      });
    }

    return result;
  });
};

const getAllDonations = async (params: IGenericFilters, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params as Record<string, string | undefined>;

  const andConditions: Prisma.BloodDonationWhereInput[] = [{ isDeleted: false }];

  if (searchTerm) {
    andConditions.push({
      OR: bloodDonationSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: filterData[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.BloodDonationWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [result, total] = await Promise.all([
    prisma.bloodDonation.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { [sortBy]: sortOrder },
      include: {
        donor: {
          omit: { password: true },
          include: { bloodGroup: true },
        },
        verifiedByDonor: {
          omit: { password: true },
        },
        organization: true,
        division: true,
        district: true,
        upazila: true,
      },
    }),
    prisma.bloodDonation.count({ where: whereConditions }),
  ]);

  return {
    meta: { page, limit, total },
    data: result,
  };
};

const getOrganizationDonations = async (
  user: IJWTPayload,
  organizationId: string,
  params: IGenericFilters,
  options: IOptions,
) => {
  await assertCanAccessOrganizationDashboard(user, organizationId);
  return getAllDonations({ ...params, organizationId }, options);
};

const getMyDonations = async (user: IJWTPayload, params: IGenericFilters, options: IOptions) => {
  const donor = await getRequesterDonor(user);
  return getAllDonations({ ...params, donorId: donor.id }, options);
};

const getSingleDonation = async (user: IJWTPayload, id: string) => {
  const donor = await getRequesterDonor(user);

  const donation = await prisma.bloodDonation.findUniqueOrThrow({
    where: { id, isDeleted: false },
    include: {
      donor: {
        omit: { password: true },
        include: { bloodGroup: true },
      },
      verifiedByDonor: { omit: { password: true } },
      organization: true,
      division: true,
      district: true,
      upazila: true,
    },
  });

  if (user.role !== "ADMIN" && donation.donorId !== donor.id) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not allowed to view this donation!");
  }

  return donation;
};

const updateDonation = async (
  user: IJWTPayload,
  id: string,
  payload: Prisma.BloodDonationUpdateInput,
) => {
  const donor = await getRequesterDonor(user);

  const existing = await prisma.bloodDonation.findUnique({
    where: { id, isDeleted: false },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Donation not found!");
  }

  if (user.role !== "ADMIN" && existing.donorId !== donor.id) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not allowed to update this donation!");
  }

  if (existing.verificationStatus === VerificationStatus.VERIFIED) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Verified donations require the dedicated reversal workflow.",
      "",
      "DONATION_REVERSAL_REQUIRED",
    );
  }

  const result = await prisma.bloodDonation.update({
    where: { id },
    data: payload,
    include: {
      donor: { omit: { password: true }, include: { bloodGroup: true } },
      verifiedByDonor: { omit: { password: true } },
      organization: true,
      division: true,
      district: true,
      upazila: true,
    },
  });

  return result;
};

const verifyDonation = async (
  user: IJWTPayload,
  id: string,
  payload: { verificationStatus: VerificationStatus; notes?: string },
) => {
  const verifier = await getRequesterDonor(user);
  const existing = await prisma.bloodDonation.findUnique({
    where: { id, isDeleted: false },
    include: { requestAssignment: { include: { request: true } } },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Donation not found!");

  const requestId = existing.requestAssignment?.requestId;
  if (requestId) {
    await assertCanUpdateBloodRequest(user, requestId);
  } else if (user.role !== "ADMIN") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only Admin can verify an independent donation.",
    );
  }

  return prisma.$transaction(async (tx) => {
    if (requestId) {
      await tx.$queryRaw`SELECT id FROM "BloodRequests" WHERE id = ${requestId} FOR UPDATE`;
    }
    await tx.$queryRaw`SELECT id FROM "bloodDonations" WHERE id = ${id} FOR UPDATE`;
    const donation = await tx.bloodDonation.findUnique({
      where: { id, isDeleted: false },
      include: {
        requestAssignment: {
          include: {
            request: {
              include: {
                bloodGroup: { select: { groupName: true } },
                division: { select: { name: true } },
                district: { select: { name: true } },
                upazila: { select: { name: true } },
                handledByOrganization: {
                  select: { name: true, phone: true },
                },
              },
            },
          },
        },
      },
    });
    if (!donation) throw new ApiError(httpStatus.NOT_FOUND, "Donation not found!");
    if (donation.verificationStatus === VerificationStatus.VERIFIED) {
      if (payload.verificationStatus === VerificationStatus.VERIFIED) {
        return donation;
      }
      throw new ApiError(
        httpStatus.CONFLICT,
        "Verified donations require the dedicated reversal workflow.",
        "",
        "DONATION_REVERSAL_REQUIRED",
      );
    }

    const now = new Date();
    const updatedDonation = await tx.bloodDonation.update({
      where: { id },
      data: {
        verificationStatus: payload.verificationStatus,
        verifiedBy: verifier.id,
        verifiedAt:
          payload.verificationStatus === VerificationStatus.VERIFIED ? now : null,
        notes: payload.notes ?? donation.notes,
      },
      include: {
        donor: { omit: { password: true }, include: { bloodGroup: true } },
        verifiedByDonor: { omit: { password: true } },
        organization: true,
        division: true,
        district: true,
        upazila: true,
      },
    });

    if (payload.verificationStatus !== VerificationStatus.VERIFIED) {
      if (donation.requestAssignmentId) {
        await tx.requestAssignment.update({
          where: { id: donation.requestAssignmentId },
          data: { status: RequestAssignmentStatus.ACCEPTED, donatedAt: null },
        });
      }
      return updatedDonation;
    }

    const nextEligibleDonationDate = new Date(donation.donationDate);
    nextEligibleDonationDate.setMonth(nextEligibleDonationDate.getMonth() + 3);
    await tx.donor.update({
      where: { id: donation.donorId },
      data: {
        lastDonationDate: donation.donationDate,
        availabilityStatus: AvailabilityStatus.UNAVAILABLE,
        nextEligibleDonationDate,
      },
    });

    const [verifiedDonationCount, totalDonationCount, activeAchievements] =
      await Promise.all([
        tx.bloodDonation.count({
          where: {
            donorId: donation.donorId,
            isDeleted: false,
            verificationStatus: VerificationStatus.VERIFIED,
          },
        }),
        tx.bloodDonation.count({
          where: { donorId: donation.donorId, isDeleted: false },
        }),
        tx.achievement.findMany({ where: { isDeleted: false, active: true } }),
      ]);
    const counts: Record<AchievementThresholdType, number> = {
      [AchievementThresholdType.VERIFIED_DONATIONS]: verifiedDonationCount,
      [AchievementThresholdType.TOTAL_DONATIONS]: totalDonationCount,
    };
    const achievementIds = activeAchievements
      .filter(
        (achievement) =>
          counts[achievement.thresholdType] >= achievement.thresholdValue,
      )
      .map((achievement) => achievement.id);
    if (achievementIds.length) {
      await tx.donorAchievement.createMany({
        data: achievementIds.map((achievementId) => ({
          donorId: donation.donorId,
          achievementId,
        })),
        skipDuplicates: true,
      });
    }

    if (!donation.requestAssignmentId || !donation.requestAssignment) {
      return updatedDonation;
    }

    await tx.requestAssignment.update({
      where: { id: donation.requestAssignmentId },
      data: { status: RequestAssignmentStatus.DONATED, donatedAt: now },
    });
    const request = donation.requestAssignment.request;
    const verified = await tx.requestAssignment.aggregate({
      where: {
        requestId: request.id,
        isDeleted: false,
        status: RequestAssignmentStatus.DONATED,
        donation: { verificationStatus: VerificationStatus.VERIFIED },
      },
      _sum: { bagUnits: true },
    });
    const verifiedUnits = verified._sum.bagUnits ?? 0;

    if (
      verifiedUnits >= request.requiredUnits &&
      request.status !== BloodRequestStatus.FULFILLED
    ) {
      assertRequestTransition(request.status, BloodRequestStatus.FULFILLED);
      await tx.bloodRequest.update({
        where: { id: request.id },
        data: {
          status: BloodRequestStatus.FULFILLED,
          fulfilledAt: now,
          version: { increment: 1 },
        },
      });
      await tx.bloodRequestStatusHistory.create({
        data: {
          requestId: request.id,
          previousStatus: request.status,
          newStatus: BloodRequestStatus.FULFILLED,
          changedById: verifier.id,
          reason: "All linked donation bags verified",
        },
      });
      await enqueueOutboxEvent(tx, {
        channel: MessageChannel.SMS,
        templateKey: "BLOOD_REQUEST_FULFILLED_REQUESTER",
        recipient: request.requesterPhone,
        payload: {
          requestId: request.id,
          referenceCode: request.referenceCode,
          bloodGroup: request.bloodGroup.groupName,
          requiredBags: request.requiredUnits,
          fulfilledBags: verifiedUnits,
          division: request.division.name,
          district: request.district.name,
          upazila: request.upazila.name,
          hospitalName: request.hospitalName,
          patientInformation: request.message,
          representativeName: request.handledByOrganization?.name,
          representativePhone: request.handledByOrganization?.phone,
        },
        aggregateType: "BloodRequest",
        aggregateId: request.id,
        eventKey: requestEventKey(request.id, "FULFILLED", "requester"),
      });
    }

    return updatedDonation;
  });
};

const rejectDonation = async (
  user: IJWTPayload,
  id: string,
  reason: string,
) =>
  verifyDonation(user, id, {
    verificationStatus: VerificationStatus.REJECTED,
    notes: reason,
  });

const reverseDonation = async (
  user: IJWTPayload,
  id: string,
  reason: string,
) => {
  if (user.role !== "ADMIN") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only Admin can reverse a verified donation.",
    );
  }
  const actor = await getRequesterDonor(user);
  const existing = await prisma.bloodDonation.findUnique({
    where: { id, isDeleted: false },
    include: { requestAssignment: { select: { requestId: true } } },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Donation not found!");
  if (existing.verificationStatus !== VerificationStatus.VERIFIED) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Only a verified donation can be reversed.",
      "",
      "DONATION_NOT_VERIFIED",
    );
  }
  const requestId = existing.requestAssignment?.requestId;

  return prisma.$transaction(async (tx) => {
    if (requestId) {
      await tx.$queryRaw`SELECT id FROM "BloodRequests" WHERE id = ${requestId} FOR UPDATE`;
    }
    await tx.$queryRaw`SELECT id FROM "bloodDonations" WHERE id = ${id} FOR UPDATE`;
    const donation = await tx.bloodDonation.findUnique({
      where: { id, isDeleted: false },
      include: { requestAssignment: { include: { request: true } } },
    });
    if (!donation || donation.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "Donation is no longer verified.",
        "",
        "DONATION_NOT_VERIFIED",
      );
    }

    const reversed = await tx.bloodDonation.update({
      where: { id },
      data: {
        verificationStatus: VerificationStatus.REJECTED,
        verifiedAt: null,
        verifiedBy: actor.id,
        notes: `REVERSAL: ${reason}`,
      },
    });

    await tx.post.updateMany({
      where: { donationId: donation.id, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    if (donation.requestAssignmentId) {
      await tx.requestAssignment.update({
        where: { id: donation.requestAssignmentId },
        data: {
          status: RequestAssignmentStatus.ACCEPTED,
          donatedAt: null,
          donationSubmittedAt: null,
        },
      });
    }

    if (donation.requestAssignment?.request) {
      const request = donation.requestAssignment.request;
      if (
        request.status === BloodRequestStatus.FULFILLED ||
        request.status === BloodRequestStatus.COMPLETED
      ) {
        await tx.bloodRequest.update({
          where: { id: request.id },
          data: {
            status: BloodRequestStatus.DONOR_FOUND,
            fulfilledAt: null,
            handoverCompletedAt: null,
            completedById: null,
            version: { increment: 1 },
          },
        });
        await tx.bloodRequestStatusHistory.create({
          data: {
            requestId: request.id,
            previousStatus: request.status,
            newStatus: BloodRequestStatus.DONOR_FOUND,
            changedById: actor.id,
            reason: `Verified donation reversed: ${reason}`,
          },
        });
      }
    }

    const latestVerified = await tx.bloodDonation.findFirst({
      where: {
        donorId: donation.donorId,
        id: { not: donation.id },
        isDeleted: false,
        verificationStatus: VerificationStatus.VERIFIED,
      },
      orderBy: { donationDate: "desc" },
      select: { donationDate: true },
    });
    const nextEligibleDonationDate = latestVerified
      ? new Date(latestVerified.donationDate)
      : null;
    if (nextEligibleDonationDate) {
      nextEligibleDonationDate.setMonth(nextEligibleDonationDate.getMonth() + 3);
    }
    await tx.donor.update({
      where: { id: donation.donorId },
      data: {
        lastDonationDate: latestVerified?.donationDate ?? null,
        nextEligibleDonationDate,
        availabilityStatus:
          nextEligibleDonationDate && nextEligibleDonationDate > new Date()
            ? AvailabilityStatus.UNAVAILABLE
            : AvailabilityStatus.AVAILABLE,
      },
    });

    const [verifiedCount, totalCount, achievements] = await Promise.all([
      tx.bloodDonation.count({
        where: {
          donorId: donation.donorId,
          isDeleted: false,
          verificationStatus: VerificationStatus.VERIFIED,
        },
      }),
      tx.bloodDonation.count({
        where: { donorId: donation.donorId, isDeleted: false },
      }),
      tx.achievement.findMany({ where: { isDeleted: false, active: true } }),
    ]);
    await tx.donorAchievement.deleteMany({ where: { donorId: donation.donorId } });
    const achievementCounts: Record<AchievementThresholdType, number> = {
      [AchievementThresholdType.VERIFIED_DONATIONS]: verifiedCount,
      [AchievementThresholdType.TOTAL_DONATIONS]: totalCount,
    };
    const unlocked = achievements.filter(
      (achievement) =>
        achievementCounts[achievement.thresholdType] >= achievement.thresholdValue,
    );
    if (unlocked.length) {
      await tx.donorAchievement.createMany({
        data: unlocked.map((achievement) => ({
          donorId: donation.donorId,
          achievementId: achievement.id,
        })),
        skipDuplicates: true,
      });
    }

    return reversed;
  });
};

const deleteDonation = async (user: IJWTPayload, id: string) => {
  const donor = await getRequesterDonor(user);

  const existing = await prisma.bloodDonation.findUnique({
    where: { id, isDeleted: false },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Donation not found!");
  }

  if (user.role !== "ADMIN" && existing.donorId !== donor.id) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not allowed to delete this donation!");
  }
  if (existing.verificationStatus === VerificationStatus.VERIFIED) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Verified donations require the dedicated reversal workflow.",
      "",
      "DONATION_REVERSAL_REQUIRED",
    );
  }

  return prisma.bloodDonation.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

export const BloodDonationService = {
  createDonation,
  getAllDonations,
  getOrganizationDonations,
  getMyDonations,
  getSingleDonation,
  updateDonation,
  verifyDonation,
  rejectDonation,
  reverseDonation,
  deleteDonation,
};

