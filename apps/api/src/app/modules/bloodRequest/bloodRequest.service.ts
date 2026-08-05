import httpStatus from "http-status";
import { createHash, randomUUID } from "crypto";
import {
  AccountStatus,
  AvailabilityStatus,
  BloodRequestStatus,
  MessageChannel,
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
import { emitDonorNotification } from "../../shared/socket";
import { enqueueOutboxEvent, requestEventKey } from "../../shared/messageOutbox";

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

const createRequest = async (payload: any, idempotencyKey: string) => {
  const normalizedKey = idempotencyKey.trim();
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(normalizedKey)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "A valid Idempotency-Key header is required.",
      "",
      "INVALID_IDEMPOTENCY_KEY",
    );
  }
  const payloadHash = createHash("sha256")
    .update(
      JSON.stringify({
        requesterName: payload.requesterName,
        requesterPhone: payload.requesterPhone,
        bloodGroupId: payload.bloodGroupId,
        hospitalName: payload.hospitalName,
        divisionId: payload.divisionId,
        districtId: payload.districtId,
        upazilaId: payload.upazilaId,
        requiredUnits: payload.requiredUnits,
        requestType: payload.requestType ?? "GENERAL",
        message: payload.message ?? null,
      }),
    )
    .digest("hex");

  const existingKey = await prisma.publicRequestIdempotency.findUnique({
    where: { key: normalizedKey },
    include: { request: { include: requestInclude } },
  });
  if (existingKey) {
    if (existingKey.payloadHash !== payloadHash) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "This Idempotency-Key was already used with a different request payload.",
        "",
        "IDEMPOTENCY_KEY_REUSED",
      );
    }
    return addAssignmentSummary(existingKey.request);
  }

  try {
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
      select: { id: true, name: true, phone: true, upazilaId: true },
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

    if (organization.phone) {
      await enqueueOutboxEvent(tx, {
        channel: MessageChannel.SMS,
        templateKey: "BLOOD_REQUEST_SUBMITTED_ORGANIZATION",
        recipient: organization.phone,
        payload: {
          requestId: request.id,
          referenceCode: request.referenceCode,
          bloodGroup: request.bloodGroup.groupName,
          requiredBags: request.requiredUnits,
          requesterName: request.requesterName,
          hospitalName: request.hospitalName,
          upazila: request.upazila.name,
        },
        aggregateType: "BloodRequest",
        aggregateId: request.id,
        eventKey: requestEventKey(request.id, "SUBMITTED", "organization"),
      });
    }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await tx.publicRequestIdempotency.create({
        data: {
          key: normalizedKey,
          payloadHash,
          requestId: request.id,
          expiresAt,
        },
      });

      return request;
    });

    return result;
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const raced = await prisma.publicRequestIdempotency.findUnique({
        where: { key: normalizedKey },
        include: { request: { include: requestInclude } },
      });
      if (raced?.payloadHash === payloadHash) {
        return addAssignmentSummary(raced.request);
      }
      throw new ApiError(
        httpStatus.CONFLICT,
        "This Idempotency-Key was already used with a different request payload.",
        "",
        "IDEMPOTENCY_KEY_REUSED",
      );
    }
    throw error;
  }
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

const trackRequest = async (referenceCode: string, phoneSuffix: string) => {
  const normalizedSuffix = phoneSuffix.replace(/\D/g, "");
  if (normalizedSuffix.length < 4 || normalizedSuffix.length > 11) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Provide at least the last four digits of the requester phone number.",
      "",
      "INVALID_TRACKING_CREDENTIALS",
    );
  }

  const request = await prisma.bloodRequest.findUnique({
    where: { referenceCode, isDeleted: false },
    select: {
      referenceCode: true,
      requesterPhone: true,
      bloodGroup: { select: { groupName: true } },
      requiredUnits: true,
      hospitalName: true,
      status: true,
      createdAt: true,
      acceptedAt: true,
      donorFoundAt: true,
      fulfilledAt: true,
      handoverCompletedAt: true,
      cancelledAt: true,
      rejectedAt: true,
      division: { select: { name: true } },
      district: { select: { name: true } },
      upazila: { select: { name: true } },
      assignments: {
        where: { isDeleted: false },
        select: { status: true, bagUnits: true },
      },
      statusHistory: {
        select: { newStatus: true, reason: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (
    !request ||
    !request.requesterPhone.replace(/\D/g, "").endsWith(normalizedSuffix)
  ) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Blood request tracking information was not found.",
      "",
      "TRACKING_NOT_FOUND",
    );
  }

  const { requesterPhone: _requesterPhone, ...safeRequest } = request;
  return addAssignmentSummary(safeRequest);
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

  const messageKey = Buffer.from(message).toString("base64url").slice(0, 48);
  return prisma.$transaction((tx) =>
    enqueueOutboxEvent(tx, {
      channel: MessageChannel.SMS,
      templateKey: "BLOOD_REQUEST_MANUAL_REQUESTER",
      recipient: request.requesterPhone,
      payload: { requestId: request.id, referenceCode: request.referenceCode, message },
      aggregateType: "BloodRequest",
      aggregateId: request.id,
      eventKey: requestEventKey(request.id, "MANUAL", messageKey),
    }),
  );
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
  trackRequest,
  getAllRequests,
  getSingleRequest,
  sendRequesterSms,
  getEligibleDonors,
  assignDonors,
  getAssignmentForDonor,
  getRequestNotifications,
};
