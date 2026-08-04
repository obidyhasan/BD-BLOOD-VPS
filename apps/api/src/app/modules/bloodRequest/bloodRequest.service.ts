import httpStatus from "http-status";
import { randomUUID } from "crypto";
import {
  AccountStatus,
  AvailabilityStatus,
  BloodRequestStatus,
  NotificationPriority,
  NotificationType,
  Prisma,
  RequestAssignmentStatus,
} from "@prisma/client";
import { prisma } from "../../shared/prisma";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";
import { bloodRequestSearchableFields } from "./bloodRequest.constant";
import ApiError from "../../errors/ApiError";
import { IJWTPayload } from "../../types";
import { assertCanUpdateBloodRequest } from "../../middlewares/orgAccess";
import { smsHelper } from "../../helper/smsHelper";
import { emitDonorNotification } from "../../shared/socket";

const requestInclude = {
  bloodGroup: true,
  division: true,
  district: true,
  upazila: true,
  organization: true,
  cancelledBy: { select: { id: true, fullName: true, email: true } },
  assignments: {
    where: { isDeleted: false },
    include: {
      donor: {
        omit: { password: true },
        include: {
          bloodGroup: true,
          division: { select: { id: true, name: true } },
          district: { select: { id: true, name: true } },
          upazila: { select: { id: true, name: true } },
          organization: { include: { organization: true } },
        },
      },
    },
    orderBy: { assignedAt: "desc" as const },
  },
} satisfies Prisma.BloodRequestInclude;

// Used only by the paginated list endpoint (getAllRequests). Its only
// consumer of `assignments` is addAssignmentSummary, which reads nothing
// but `.status`/`.isDeleted` to derive counts — so unlike requestInclude,
// this never pulls each assignment's full donor record (and that donor's
// own blood group/location/organization) for every row of every page.
// Full assignment/donor detail is fetched on demand via the dedicated
// GET /blood-requests/:id/assignments endpoint, not from the list response.
const requestListInclude = {
  bloodGroup: true,
  division: true,
  district: true,
  upazila: true,
  organization: true,
  cancelledBy: { select: { id: true, fullName: true, email: true } },
  assignments: {
    where: { isDeleted: false },
    select: { id: true, status: true, bagUnits: true, isDeleted: true },
  },
} satisfies Prisma.BloodRequestInclude;

const getActorDonor = async (user: IJWTPayload) => {
  const donor = await prisma.donor.findUnique({
    where: { email: user.email, isDeleted: false },
    select: { id: true, email: true, role: true },
  });
  if (!donor) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  return donor;
};

const addAssignmentSummary = <
  T extends {
    requiredUnits: number;
    assignments?: {
      status: RequestAssignmentStatus;
      bagUnits?: number;
      isDeleted?: boolean;
    }[];
  },
>(request: T) => {
  const assignments = request.assignments?.filter((a) => !a.isDeleted) ?? [];
  const units = (assignment: { bagUnits?: number }) => assignment.bagUnits ?? 1;
  const committedBags = assignments
    .filter(
      (assignment) =>
        assignment.status === RequestAssignmentStatus.ACCEPTED ||
        assignment.status === RequestAssignmentStatus.DONATION_PENDING ||
        assignment.status === RequestAssignmentStatus.DONATED,
    )
    .reduce((total, assignment) => total + units(assignment), 0);
  const fulfilledBags = assignments
    .filter((assignment) => assignment.status === RequestAssignmentStatus.DONATED)
    .reduce((total, assignment) => total + units(assignment), 0);

  return {
    ...request,
    assignmentSummary: {
      requiredBags: request.requiredUnits,
      committedBags,
      fulfilledBags,
      remainingCommitmentBags: Math.max(request.requiredUnits - committedBags, 0),
      remainingFulfillmentBags: Math.max(request.requiredUnits - fulfilledBags, 0),
      notifiedDonors: assignments.filter(
        (assignment) => assignment.status === RequestAssignmentStatus.NOTIFIED,
      ).length,
      acceptedDonors: assignments.filter(
        (assignment) => assignment.status === RequestAssignmentStatus.ACCEPTED,
      ).length,
      pendingDonations: assignments.filter(
        (assignment) =>
          assignment.status === RequestAssignmentStatus.DONATION_PENDING,
      ).length,
      donatedDonors: assignments.filter(
        (assignment) => assignment.status === RequestAssignmentStatus.DONATED,
      ).length,
      inactiveAssignments: assignments.filter(
        (assignment) =>
          assignment.status === RequestAssignmentStatus.DECLINED ||
          assignment.status === RequestAssignmentStatus.REJECTED ||
          assignment.status === RequestAssignmentStatus.EXPIRED ||
          assignment.status === RequestAssignmentStatus.CANCELLED,
      ).length,
    },
  };
};

const resolveRequestOrganizationId = async (
  request: { id: string; organizationId?: string | null },
  tx: Prisma.TransactionClient = prisma,
) => {
  if (request.organizationId) return request.organizationId;

  const notification = await tx.bloodRequestNotification.findFirst({
    where: { requestId: request.id, isDeleted: false },
    orderBy: { createdAt: "asc" },
    select: { organizationId: true },
  });

  return notification?.organizationId ?? null;
};

const createStatusHistory = async (
  tx: Prisma.TransactionClient,
  data: {
    requestId: string;
    previousStatus?: BloodRequestStatus | null;
    newStatus: BloodRequestStatus;
    changedById?: string | null;
    reason?: string;
  },
) => {
  await tx.bloodRequestStatusHistory.create({
    data: {
      requestId: data.requestId,
      previousStatus: data.previousStatus ?? null,
      newStatus: data.newStatus,
      changedById: data.changedById ?? null,
      reason: data.reason,
    },
  });
};

const createRequest = async (payload: any) => {
  const result = await prisma.$transaction(async (tx) => {
    const [bloodGroup, ancestry] = await Promise.all([
      tx.bloodGroup.findUnique({ where: { id: payload.bloodGroupId } }),
      tx.upazila.findFirst({
        where: {
          id: payload.upazilaId,
          isDeleted: false,
          districtId: payload.districtId,
          district: {
            isDeleted: false,
            divisionId: payload.divisionId,
            division: { isDeleted: false },
          },
        },
        select: { id: true, districtId: true, district: { select: { divisionId: true } } },
      }),
    ]);
    if (!bloodGroup) {
      throw new ApiError(httpStatus.NOT_FOUND, "Invalid Blood Group ID!");
    }
    if (!ancestry) {
      throw new ApiError(
        httpStatus.UNPROCESSABLE_ENTITY,
        "Selected Division, District, and Upazila do not form a valid geographic hierarchy.",
        "",
        "INVALID_GEOGRAPHIC_ANCESTRY",
      );
    }

    const organization = await tx.organization.findFirst({
      where: {
        upazilaId: ancestry.id,
        level: "UPAZILA",
        canonical: true,
        isDeleted: false,
      },
      select: { id: true, name: true, upazilaId: true },
    });
    if (!organization) {
      throw new ApiError(
        httpStatus.UNPROCESSABLE_ENTITY,
        "No canonical organization is configured for the selected Upazila.",
        "",
        "ORGANIZATION_NOT_CONFIGURED",
      );
    }

    const request = await tx.bloodRequest.create({
      data: {
        requesterName: payload.requesterName,
        requesterPhone: payload.requesterPhone,
        bloodGroupId: payload.bloodGroupId,
        hospitalName: payload.hospitalName,
        divisionId: ancestry.district.divisionId,
        districtId: ancestry.districtId,
        upazilaId: ancestry.id,
        organizationId: organization.id,
        handledByOrganizationId: organization.id,
        requiredUnits: payload.requiredUnits,
        requestType: payload.requestType ?? "GENERAL",
        message: payload.message,
        status: "SUBMITTED",
      },
      include: {
        bloodGroup: true,
        division: true,
        district: true,
        upazila: true,
        organization: true,
      },
    });

    await createStatusHistory(tx, {
      requestId: request.id,
      previousStatus: null,
      newStatus: "SUBMITTED",
      reason: "Public request submitted and routed to canonical Upazila organization",
    });

    await tx.bloodRequestNotification.create({
      data: {
        requestId: request.id,
        organizationId: organization.id,
        smsSent: false,
      },
    });

    return request;
  });

  return result;
};

const getManagedOrganizationIds = async (user: IJWTPayload) => {
  if (user.role === "ADMIN") return null;
  const donor = await prisma.donor.findUnique({
    where: { email: user.email, isDeleted: false },
    select: { id: true },
  });
  if (!donor) throw new ApiError(httpStatus.FORBIDDEN, "Donor profile not found");
  const memberships = await prisma.organizationMember.findMany({
    where: {
      donorId: donor.id,
      organizationId: { not: null },
      status: "ACTIVE",
      isDeleted: false,
      position: { level: { in: ["EXECUTIVE", "MANAGEMENT"] } },
    },
    select: { organizationId: true },
  });
  const organizationIds = memberships
    .map((membership) => membership.organizationId)
    .filter((id): id is string => Boolean(id));
  if (!organizationIds.length) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Insufficient organization permissions",
    );
  }
  return organizationIds;
};

const getAllRequests = async (
  user: IJWTPayload,
  params: IGenericFilters,
  options: IOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params as Record<string, string | undefined>;

  const organizationIds = await getManagedOrganizationIds(user);
  const andConditions: Prisma.BloodRequestWhereInput[] = [
    {
      isDeleted: false,
      ...(organizationIds
        ? { handledByOrganizationId: { in: organizationIds } }
        : {}),
    },
  ];

  if (searchTerm) {
    andConditions.push({
      OR: bloodRequestSearchableFields.map((field) => ({
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

  const whereConditions: Prisma.BloodRequestWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [result, total] = await Promise.all([
    prisma.bloodRequest.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { [sortBy]: sortOrder },
      include: requestListInclude,
    }),
    prisma.bloodRequest.count({ where: whereConditions }),
  ]);

  return {
    meta: { page, limit, total },
    data: result.map(addAssignmentSummary),
  };
};

const getSingleRequest = async (user: IJWTPayload, id: string) => {
  await assertCanUpdateBloodRequest(user, id);
  const request = await prisma.bloodRequest.findUniqueOrThrow({
    where: { id, isDeleted: false },
    include: requestInclude,
  });
  return addAssignmentSummary(request);
};

const updateRequestStatus = async (
  user: IJWTPayload,
  id: string,
  status: BloodRequestStatus,
  organizationId?: string,
) => {
  await assertCanUpdateBloodRequest(user, id);
  const actor = await getActorDonor(user);

  if (status === "CANCELLED") {
    return cancelRequest(user, id);
  }

  const existing = await prisma.bloodRequest.findUnique({
    where: { id, isDeleted: false },
    include: { bloodGroup: true },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blood request not found!");
  }
  if (existing.status === "CANCELLED") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cancelled requests cannot be updated.",
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const request = await tx.bloodRequest.update({
      where: { id },
      data: {
        status,
        confirmedAt:
          status === "FULFILLED"
            ? (existing.confirmedAt ?? new Date())
            : existing.confirmedAt,
      },
      include: requestInclude,
    });

    if (existing.status !== status) {
      await createStatusHistory(tx, {
        requestId: id,
        previousStatus: existing.status,
        newStatus: status,
        changedById: actor.id,
        reason: "Manual status update",
      });
    }

    if (status === "FULFILLED" && existing.status !== "FULFILLED") {
      let remaining = existing.requiredUnits;
      const inventories = await tx.organizationBloodInventory.findMany({
        where: {
          isDeleted: false,
          bloodGroupId: existing.bloodGroupId,
          availableUnits: { gt: 0 },
          organization: {
            isDeleted: false,
            districtId: existing.districtId,
            upazilaId: existing.upazilaId,
            ...(organizationId ? { id: organizationId } : {}),
          },
        },
        orderBy: { availableUnits: "desc" },
      });

      for (const inv of inventories) {
        if (remaining <= 0) break;
        const deduct = Math.min(remaining, inv.availableUnits);
        await tx.organizationBloodInventory.update({
          where: { id: inv.id },
          data: { availableUnits: inv.availableUnits - deduct },
        });
        remaining -= deduct;
      }
    }

    return request;
  });

  if (status === "PROCESSING" && existing.status !== "PROCESSING") {
    await assignDonors(user, id);
  }

  if (
    status === "FULFILLED" &&
    existing.status !== "FULFILLED" &&
    existing.requesterPhone
  ) {
    void smsHelper.sendSMS(
      existing.requesterPhone,
      `BD Blood: Your blood request for ${existing.bloodGroup?.groupName ?? "blood"} at ${existing.hospitalName} has been fulfilled. Thank you.`,
    );
  }

  return addAssignmentSummary(updated);
};

const cancelRequest = async (user: IJWTPayload, id: string) => {
  await assertCanUpdateBloodRequest(user, id);
  const actor = await getActorDonor(user);

  const existing = await prisma.bloodRequest.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blood request not found!");
  }
  if (existing.status === "FULFILLED") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Completed requests cannot be cancelled.",
    );
  }
  if (existing.status === "CANCELLED") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This request is already cancelled.",
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.requestAssignment.updateMany({
      where: {
        requestId: id,
        isDeleted: false,
        status: RequestAssignmentStatus.PENDING,
      },
      data: { status: RequestAssignmentStatus.CANCELLED },
    });

    const request = await tx.bloodRequest.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledById: actor.id,
      },
      include: requestInclude,
    });

    await createStatusHistory(tx, {
      requestId: id,
      previousStatus: existing.status,
      newStatus: "CANCELLED",
      changedById: actor.id,
      reason: "Request cancelled by admin",
    });

    return request;
  });

  return addAssignmentSummary(updated);
};

const deleteRequest = async (user: IJWTPayload, id: string) => {
  return cancelRequest(user, id);
};

const getEligibleDonors = async (user: IJWTPayload, id: string) => {
  const accessOrganizationId = await assertCanUpdateBloodRequest(user, id);

  const request = await prisma.bloodRequest.findUnique({
    where: { id, isDeleted: false },
    include: { bloodGroup: true, organization: true },
  });
  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blood request not found!");
  }
  if (request.status !== "PROCESSING") {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Eligible donors are available only while the request is processing.",
      "",
      "INVALID_REQUEST_TRANSITION",
    );
  }

  const organizationId =
    accessOrganizationId ?? (await resolveRequestOrganizationId(request));
  if (!organizationId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "No organization is linked to this request.",
    );
  }

  const donors = await prisma.donor.findMany({
    where: {
      isDeleted: false,
      isVerified: true,
      profileStatus: "COMPLETE",
      role: "DONOR",
      accountStatus: AccountStatus.ACTIVE,
      availabilityStatus: AvailabilityStatus.AVAILABLE,
      OR: [
        { nextEligibleDonationDate: null },
        { nextEligibleDonationDate: { lte: new Date() } },
      ],
      bloodGroupId: request.bloodGroupId,
      divisionId: request.divisionId,
      affiliations: {
        some: { organizationId, active: true },
      },
      requestAssignments: {
        none: {
          requestId: request.id,
          isDeleted: false,
        },
      },
    },
    omit: { password: true },
    include: {
      bloodGroup: true,
      division: { select: { id: true, name: true } },
      district: { select: { id: true, name: true } },
      upazila: { select: { id: true, name: true } },
      affiliations: {
        where: { organizationId, active: true },
        take: 1,
        include: { organization: true },
      },
    },
  });

  const scored = donors
    .map((donor) => {
      const addressRank =
        donor.upazilaId === request.upazilaId
          ? 1
          : donor.districtId === request.districtId
            ? 2
            : 3;
      const matchLevel =
        addressRank === 1
          ? "UPAZILA"
          : addressRank === 2
            ? "DISTRICT"
            : "DIVISION";
      return { ...donor, matchLevel, addressRank };
    })
    .sort(
      (a, b) =>
        a.addressRank - b.addressRank || a.fullName.localeCompare(b.fullName),
    );

  return {
    request: addAssignmentSummary({ ...request, assignments: [] }),
    organizationId,
    donors: scored,
  };
};

const assignDonors = async (user: IJWTPayload, id: string) => {
  const accessOrganizationId = await assertCanUpdateBloodRequest(user, id);
  const actor = await getActorDonor(user);

  const emittedNotifications: {
    donorId: string;
    notification: Record<string, unknown>;
  }[] = [];

  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.bloodRequest.findUnique({
      where: { id, isDeleted: false },
      include: {
        bloodGroup: true,
        assignments: { where: { isDeleted: false } },
      },
    });
    if (!request)
      throw new ApiError(httpStatus.NOT_FOUND, "Blood request not found!");
    if (request.status !== "PROCESSING") {
      throw new ApiError(
        httpStatus.CONFLICT,
        "Donors can only be dispatched while the request is processing.",
        "",
        "INVALID_REQUEST_TRANSITION",
      );
    }

    const organizationId =
      accessOrganizationId ?? (await resolveRequestOrganizationId(request, tx));
    if (!organizationId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No organization is linked to this request.",
      );
    }

    const eligibleDonors = await tx.donor.findMany({
      where: {
        isDeleted: false,
        isVerified: true,
        profileStatus: "COMPLETE",
        role: "DONOR",
        accountStatus: AccountStatus.ACTIVE,
        availabilityStatus: AvailabilityStatus.AVAILABLE,
        OR: [
          { nextEligibleDonationDate: null },
          { nextEligibleDonationDate: { lte: new Date() } },
        ],
        bloodGroupId: request.bloodGroupId,
        divisionId: request.divisionId,
        affiliations: {
          some: { organizationId, active: true },
        },
        requestAssignments: {
          none: {
            requestId: request.id,
            isDeleted: false,
          },
        },
      },
      select: { id: true, notifyInApp: true },
      orderBy: { fullName: "asc" },
    });

    if (!eligibleDonors.length) {
      return { assignments: [], assignedCount: 0 };
    }

    // Generate ids client-side so both the assignments and their related
    // notifications can be inserted with createMany (2 queries total)
    // instead of up to 2*N sequential create() calls — this loop used to
    // pay one round trip per eligible donor (plus a second for donors with
    // notifyInApp on), which scales badly for a large matching pool.
    const now = new Date();
    const assignments = eligibleDonors.map((donor) => ({
      id: randomUUID(),
      requestId: id,
      donorId: donor.id,
      assignedById: actor.id,
      status: RequestAssignmentStatus.NOTIFIED,
      assignedAt: now,
      notifiedAt: now,
      acceptedAt: null as Date | null,
      rejectedAt: null as Date | null,
      rejectionReason: null as string | null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null as Date | null,
      isDeleted: false,
    }));

    await tx.requestAssignment.createMany({
      data: assignments,
    });

    const notifiableDonors = eligibleDonors.filter((d) => d.notifyInApp);
    if (notifiableDonors.length) {
      const assignmentByDonorId = new Map(
        assignments.map((a) => [a.donorId, a]),
      );
      const notifications = notifiableDonors.map((donor) => ({
        id: randomUUID(),
        donorId: donor.id,
        title: "Blood request available",
        message:
          "A matching blood request is available in your organization. Please accept or reject the request.",
        type: NotificationType.BLOOD_REQUEST,
        priority: NotificationPriority.HIGH,
        relatedId: assignmentByDonorId.get(donor.id)!.id,
        relatedType: "REQUEST_ASSIGNMENT",
        isRead: false,
        createdAt: now,
        updatedAt: now,
      }));

      await tx.notification.createMany({ data: notifications });

      for (const notification of notifications) {
        emittedNotifications.push({
          donorId: notification.donorId,
          notification,
        });
      }
    }

    return { assignments, assignedCount: assignments.length };
  });

  for (const item of emittedNotifications) {
    emitDonorNotification(item.donorId, item.notification);
  }

  return result;
};

const getAssignmentForDonor = async (
  user: IJWTPayload,
  assignmentId: string,
) => {
  const donor = await getActorDonor(user);
  const assignment = await prisma.requestAssignment.findUnique({
    where: { id: assignmentId, donorId: donor.id, isDeleted: false },
    include: {
      request: {
        include: {
          bloodGroup: true,
          division: true,
          district: true,
          upazila: true,
          organization: true,
        },
      },
      donor: { omit: { password: true }, include: { bloodGroup: true } },
    },
  });
  if (!assignment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Assignment not found!");
  }
  return assignment;
};

const respondToAssignment = async (
  user: IJWTPayload,
  assignmentId: string,
  action: "ACCEPTED" | "REJECTED",
  rejectionReason?: string,
) => {
  const donor = await getActorDonor(user);
  let fulfilledNow = false;

  const result = await prisma.$transaction(async (tx) => {
    const existingAssignment = await tx.requestAssignment.findUnique({
      where: { id: assignmentId, donorId: donor.id, isDeleted: false },
      select: { requestId: true },
    });
    if (!existingAssignment)
      throw new ApiError(httpStatus.NOT_FOUND, "Assignment not found!");

    await tx.$queryRaw`SELECT id FROM "BloodRequests" WHERE id = ${existingAssignment.requestId} FOR UPDATE`;

    const assignment = await tx.requestAssignment.findUnique({
      where: { id: assignmentId, donorId: donor.id, isDeleted: false },
      include: {
        request: {
          include: {
            assignments: { where: { isDeleted: false } },
            bloodGroup: true,
          },
        },
      },
    });
    if (!assignment)
      throw new ApiError(httpStatus.NOT_FOUND, "Assignment not found!");

    if (assignment.request.status === "CANCELLED") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "This blood request has been cancelled.",
      );
    }
    if (
      assignment.status === RequestAssignmentStatus.ACCEPTED ||
      assignment.status === RequestAssignmentStatus.REJECTED
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "This donor assignment has already been processed.",
      );
    }
    if (assignment.status === RequestAssignmentStatus.CANCELLED) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "This donor assignment is no longer active.",
      );
    }

    if (action === "ACCEPTED") {
      const acceptedBefore = assignment.request.assignments.filter(
        (a) => a.status === RequestAssignmentStatus.ACCEPTED,
      ).length;
      if (acceptedBefore >= assignment.request.requiredUnits) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "This request is already fulfilled.",
        );
      }
    }

    const updatedAssignment = await tx.requestAssignment.update({
      where: { id: assignmentId },
      data: {
        status: action,
        acceptedAt: action === "ACCEPTED" ? new Date() : undefined,
        rejectedAt: action === "REJECTED" ? new Date() : undefined,
        rejectionReason: action === "REJECTED" ? rejectionReason : undefined,
      },
      include: {
        request: {
          include: {
            assignments: { where: { isDeleted: false } },
            bloodGroup: true,
          },
        },
      },
    });

    if (action === "REJECTED") return updatedAssignment;

    const acceptedAfter = await tx.requestAssignment.count({
      where: {
        requestId: updatedAssignment.requestId,
        isDeleted: false,
        status: RequestAssignmentStatus.ACCEPTED,
      },
    });

    if (acceptedAfter >= updatedAssignment.request.requiredUnits) {
      await tx.requestAssignment.updateMany({
        where: {
          requestId: updatedAssignment.requestId,
          isDeleted: false,
          status: RequestAssignmentStatus.PENDING,
          id: { not: assignmentId },
        },
        data: { status: RequestAssignmentStatus.CANCELLED },
      });

      await tx.notification.updateMany({
        where: {
          isDeleted: false,
          relatedType: "REQUEST_ASSIGNMENT",
          relatedId: {
            in: updatedAssignment.request.assignments
              .filter(
                (a) =>
                  a.id !== assignmentId &&
                  a.status === RequestAssignmentStatus.PENDING,
              )
              .map((a) => a.id),
          },
        },
        data: { isRead: true },
      });

      if (updatedAssignment.request.status !== "FULFILLED") {
        await tx.bloodRequest.update({
          where: { id: updatedAssignment.requestId },
          data: { status: "FULFILLED", confirmedAt: new Date() },
        });
        await createStatusHistory(tx, {
          requestId: updatedAssignment.requestId,
          previousStatus: updatedAssignment.request.status,
          newStatus: "FULFILLED",
          changedById: donor.id,
          reason: "Required donor count accepted",
        });
        fulfilledNow = true;
      }
    }

    return updatedAssignment;
  });

  if (action === "ACCEPTED" && fulfilledNow && result.request.requesterPhone) {
    void smsHelper.sendSMS(
      result.request.requesterPhone,
      `BD Blood: Your ${result.request.bloodGroup?.groupName ?? "blood"} request at ${result.request.hospitalName} is confirmed.`,
    );
  }

  return result;
};

const rematchOrganizations = async (_id: string) => {
  throw new ApiError(
    httpStatus.CONFLICT,
    "Organization rematching is deprecated. Requests are routed to one canonical Upazila organization; use donor dispatch after processing starts.",
    "",
    "LEGACY_REMATCH_DISABLED",
  );
};

const sendRequesterSms = async (
  user: IJWTPayload,
  id: string,
  message: string,
) => {
  await assertCanUpdateBloodRequest(user, id);

  const request = await prisma.bloodRequest.findUnique({
    where: { id, isDeleted: false },
  });
  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blood request not found!");
  }

  return smsHelper.sendSMS(request.requesterPhone, message);
};

const getRequestNotifications = async (id: string) => {
  const request = await prisma.bloodRequest.findUnique({
    where: { id, isDeleted: false },
  });
  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blood request not found!");
  }

  return prisma.bloodRequestNotification.findMany({
    where: { requestId: id, isDeleted: false },
    include: {
      organization: true,
    },
    orderBy: { notifiedAt: "desc" },
  });
};

export const BloodRequestService = {
  createRequest,
  getAllRequests,
  getSingleRequest,
  updateRequestStatus,
  cancelRequest,
  sendRequesterSms,
  deleteRequest,
  getEligibleDonors,
  assignDonors,
  getAssignmentForDonor,
  respondToAssignment,
  rematchOrganizations,
  getRequestNotifications,
};
