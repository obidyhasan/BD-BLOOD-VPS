import httpStatus from "http-status";
import { OrganizationMemberStatus, PositionLevel, Prisma, Role } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";
import { IJWTPayload } from "../../types";

const createNotificationRecord = async (payload: {
  requestId: string;
  organizationId: string;
  smsSent?: boolean;
}) => {
  const request = await prisma.bloodRequest.findUnique({
    where: { id: payload.requestId, isDeleted: false },
  });
  if (!request) throw new ApiError(httpStatus.NOT_FOUND, "Blood request not found!");

  const org = await prisma.organization.findUnique({
    where: { id: payload.organizationId, isDeleted: false },
  });
  if (!org) throw new ApiError(httpStatus.NOT_FOUND, "Organization not found!");

  return prisma.bloodRequestNotification.create({
    data: {
      requestId: payload.requestId,
      organizationId: payload.organizationId,
      smsSent: payload.smsSent ?? false,
    },
    include: {
      request: { include: { bloodGroup: true } },
      organization: true,
    },
  });
};

const getAllNotificationRecords = async (params: IGenericFilters, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  // Query-string values are always strings/undefined in practice — see
  // IGenericFilters' doc comment.
  const filters = params as Record<string, string | undefined>;

  const whereConditions: Prisma.BloodRequestNotificationWhereInput = {
    isDeleted: false,
    ...(filters.requestId ? { requestId: filters.requestId } : {}),
    ...(filters.organizationId ? { organizationId: filters.organizationId } : {}),
    ...(filters.smsSent !== undefined
      ? { smsSent: filters.smsSent === "true" }
      : {}),
  };

  const [result, total] = await Promise.all([
    prisma.bloodRequestNotification.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { [sortBy]: sortOrder },
      include: {
        request: { include: { bloodGroup: true } },
        organization: true,
      },
    }),
    prisma.bloodRequestNotification.count({ where: whereConditions }),
  ]);

  return { meta: { page, limit, total }, data: result };
};

const getSingleNotificationRecord = async (id: string) => {
  return prisma.bloodRequestNotification.findUniqueOrThrow({
    where: { id, isDeleted: false },
    include: {
      request: { include: { bloodGroup: true } },
      organization: true,
    },
  });
};

const updateNotificationRecord = async (
  id: string,
  payload: Prisma.BloodRequestNotificationUpdateInput,
) => {
  const existing = await prisma.bloodRequestNotification.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Blood request notification not found!");

  return prisma.bloodRequestNotification.update({
    where: { id },
    data: payload,
  });
};

const deleteNotificationRecord = async (id: string) => {
  const existing = await prisma.bloodRequestNotification.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Blood request notification not found!");

  return prisma.bloodRequestNotification.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

const getOrganizationNotificationRecords = async (
  user: IJWTPayload,
  params: Record<string, unknown>,
  options: Record<string, unknown>,
) => {
  let organizationId = params.organizationId as string | undefined;

  if (user.role !== Role.ADMIN) {
    const donor = await prisma.donor.findUnique({ where: { email: user.email } });
    if (!donor) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");

    const membership = await prisma.organizationMember.findFirst({
      where: {
        donorId: donor.id,
        status: OrganizationMemberStatus.ACTIVE,
        isDeleted: false,
      },
      include: { position: { select: { level: true } } },
    });
    if (!membership?.organizationId) {
      throw new ApiError(httpStatus.FORBIDDEN, "No active organization membership");
    }
    if (
      membership.position.level !== PositionLevel.EXECUTIVE &&
      membership.position.level !== PositionLevel.MANAGEMENT
    ) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Insufficient organization permissions",
      );
    }
    organizationId = membership.organizationId;
  }

  if (!organizationId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Organization ID is required");
  }

  return getAllNotificationRecords({ ...params, organizationId }, options);
};

export const BloodRequestNotificationService = {
  createNotificationRecord,
  getAllNotificationRecords,
  getOrganizationNotificationRecords,
  getSingleNotificationRecord,
  updateNotificationRecord,
  deleteNotificationRecord,
};

