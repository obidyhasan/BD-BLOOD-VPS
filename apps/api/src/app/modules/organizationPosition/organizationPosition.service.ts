import httpStatus from "http-status";
import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";

const createPosition = async (payload: Prisma.OrganizationPositionCreateInput) => {
  const duplicate = await prisma.organizationPosition.findFirst({
    where: {
      positionName: { equals: payload.positionName, mode: "insensitive" },
      level: payload.level,
      isDeleted: false,
    },
    select: { id: true },
  });
  if (duplicate) {
    throw new ApiError(httpStatus.CONFLICT, "Organization position already exists!");
  }

  return prisma.organizationPosition.create({ data: payload });
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

  if (
    payload.positionName !== undefined ||
    payload.level !== undefined
  ) {
    const positionName =
      typeof payload.positionName === "string"
        ? payload.positionName
        : existing.positionName;
    const level =
      typeof payload.level === "string" ? payload.level : existing.level;
    const duplicate = await prisma.organizationPosition.findFirst({
      where: {
        id: { not: id },
        positionName: { equals: positionName, mode: "insensitive" },
        level,
        isDeleted: false,
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ApiError(httpStatus.CONFLICT, "Organization position already exists!");
    }
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

  const activeOccupants = await prisma.organizationMember.count({
    where: {
      positionId: id,
      isDeleted: false,
      status: "ACTIVE",
    },
  });
  if (activeOccupants > 0) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Cannot delete a position while it has active occupants.",
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
