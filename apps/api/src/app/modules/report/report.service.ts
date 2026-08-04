import httpStatus from "http-status";
import { AccountStatus, Prisma, ReportStatus, ReportTargetType } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";
import { IJWTPayload } from "../../types";

const getRequesterDonor = async (user: IJWTPayload) => {
  const donor = await prisma.donor.findUnique({ where: { email: user.email } });
  if (!donor) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  if (donor.isDeleted) throw new ApiError(httpStatus.BAD_REQUEST, "User is deleted!");
  if (donor.accountStatus !== AccountStatus.ACTIVE) {
    throw new ApiError(httpStatus.FORBIDDEN, `User is ${donor.accountStatus}`);
  }
  return donor;
};

const assertTargetExists = async (targetType: ReportTargetType, targetId: string) => {
  switch (targetType) {
    case "DONOR": {
      const donor = await prisma.donor.findUnique({ where: { id: targetId, isDeleted: false } });
      if (!donor) throw new ApiError(httpStatus.NOT_FOUND, "Target donor not found!");
      return;
    }
    case "ORGANIZATION": {
      const org = await prisma.organization.findUnique({ where: { id: targetId, isDeleted: false } });
      if (!org) throw new ApiError(httpStatus.NOT_FOUND, "Target organization not found!");
      return;
    }
    case "POST": {
      const post = await prisma.post.findUnique({ where: { id: targetId, isDeleted: false } });
      if (!post) throw new ApiError(httpStatus.NOT_FOUND, "Target post not found!");
      return;
    }
    case "EVENT": {
      const event = await prisma.event.findUnique({ where: { id: targetId, isDeleted: false } });
      if (!event) throw new ApiError(httpStatus.NOT_FOUND, "Target event not found!");
      return;
    }
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid report target type!");
  }
};

const createReport = async (user: IJWTPayload, payload: any) => {
  const donor = await getRequesterDonor(user);

  await assertTargetExists(payload.targetType, payload.targetId);

  return prisma.report.create({
    data: {
      reportedBy: donor.id,
      targetType: payload.targetType,
      targetId: payload.targetId,
      reason: payload.reason,
      status: ReportStatus.PENDING,
    },
    include: {
      reporter: { omit: { password: true } },
    },
  });
};

const getAllReports = async (params: IGenericFilters, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const filters = params as Record<string, string | undefined>;
  const whereConditions: Prisma.ReportWhereInput = {
    isDeleted: false,
    ...(filters.status ? { status: filters.status as ReportStatus } : {}),
    ...(filters.targetType ? { targetType: filters.targetType as ReportTargetType } : {}),
    ...(filters.reportedBy ? { reportedBy: filters.reportedBy } : {}),
  };

  const [result, total] = await Promise.all([
    prisma.report.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { [sortBy]: sortOrder },
      include: { reporter: { omit: { password: true } } },
    }),
    prisma.report.count({ where: whereConditions }),
  ]);

  return { meta: { page, limit, total }, data: result };
};

const getMyReports = async (user: IJWTPayload, params: IGenericFilters, options: IOptions) => {
  const donor = await getRequesterDonor(user);
  return getAllReports({ ...params, reportedBy: donor.id }, options);
};

const updateReportStatus = async (id: string, status: ReportStatus) => {
  const existing = await prisma.report.findUnique({ where: { id, isDeleted: false } });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Report not found!");

  return prisma.report.update({
    where: { id },
    data: { status },
  });
};

const deleteReport = async (id: string) => {
  const existing = await prisma.report.findUnique({ where: { id, isDeleted: false } });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Report not found!");

  return prisma.report.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

export const ReportService = {
  createReport,
  getAllReports,
  getMyReports,
  updateReportStatus,
  deleteReport,
};

