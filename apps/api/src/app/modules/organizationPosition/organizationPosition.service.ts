import httpStatus from "http-status";
import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";

const createPosition = async (payload: any) => {
  return prisma.organizationPosition.create({
    data: {
      positionName: payload.positionName,
      positionOrder: payload.positionOrder,
      level: payload.level ?? "SUPPORT",
      positionStatus: payload.positionStatus ?? "ACTIVE",
    },
  });
};

const getAllPositions = async (params: IGenericFilters, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const whereConditions: Prisma.OrganizationPositionWhereInput = {
    isDeleted: false,
  };

  const [result, total] = await Promise.all([
    prisma.organizationPosition.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.organizationPosition.count({
      where: whereConditions,
    }),
  ]);

  return { meta: { page, limit, total }, data: result };
};

const getSinglePosition = async (id: string) => {
  return prisma.organizationPosition.findUniqueOrThrow({
    where: { id, isDeleted: false },
  });
};

const updatePosition = async (
  id: string,
  payload: Prisma.OrganizationPositionUpdateInput,
) => {
  const existing = await prisma.organizationPosition.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Organization position not found!",
    );
  }

  return prisma.organizationPosition.update({
    where: { id },
    data: payload,
  });
};

const deletePosition = async (id: string) => {
  const existing = await prisma.organizationPosition.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Organization position not found!",
    );
  }

  return prisma.organizationPosition.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

export const OrganizationPositionService = {
  createPosition,
  getAllPositions,
  getSinglePosition,
  updatePosition,
  deletePosition,
};
