import httpStatus from "http-status";
import {
  AccountStatus,
  AvailabilityStatus,
  OrganizationMemberStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";

const upsertInventory = async (payload: {
  organizationId: string;
  bloodGroupId: string;
  availableUnits: number;
}) => {
  const [organization, bloodGroup] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: payload.organizationId, isDeleted: false },
    }),
    prisma.bloodGroup.findUnique({
      where: { id: payload.bloodGroupId, isDeleted: false },
    }),
  ]);
  if (!organization) {
    throw new ApiError(httpStatus.NOT_FOUND, "Organization not found!");
  }
  if (!bloodGroup) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blood group not found!");
  }

  const result = await prisma.organizationBloodInventory.upsert({
    where: {
      organizationId_bloodGroupId: {
        organizationId: payload.organizationId,
        bloodGroupId: payload.bloodGroupId,
      },
    },
    create: {
      organizationId: payload.organizationId,
      bloodGroupId: payload.bloodGroupId,
      availableUnits: payload.availableUnits,
      lastUpdated: new Date(),
    },
    update: {
      availableUnits: payload.availableUnits,
      lastUpdated: new Date(),
    },
    include: {
      organization: true,
      bloodGroup: true,
    },
  });

  return result;
};

const getAllInventory = async (params: IGenericFilters, options: IOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const { organizationId, bloodGroupId, divisionId, districtId, upazilaId } =
    params as Record<string, string | undefined>;

  const donorWhereConditions: Prisma.DonorWhereInput = {
    isDeleted: false,
    accountStatus: AccountStatus.ACTIVE,
    availabilityStatus: AvailabilityStatus.AVAILABLE,
    ...(bloodGroupId ? { bloodGroupId } : {}),
    ...(divisionId ? { divisionId } : {}),
    ...(districtId ? { districtId } : {}),
    ...(upazilaId ? { upazilaId } : {}),
    ...(organizationId
      ? {
          organization: {
            is: {
              isDeleted: false,
              status: OrganizationMemberStatus.ACTIVE,
              organizationId,
            },
          },
        }
      : {}),
  };

  const [bloodGroups, donorCounts] = await Promise.all([
    prisma.bloodGroup.findMany({
      where: { isDeleted: false },
      orderBy: { groupName: "asc" },
    }),
    prisma.donor.groupBy({
      by: ["bloodGroupId"],
      where: donorWhereConditions,
      _count: { _all: true },
    }),
  ]);

  const countByBloodGroupId = new Map(
    donorCounts.map((row) => [row.bloodGroupId, row._count._all]),
  );

  const allInventory = bloodGroups.map((group) => ({
    id: group.id,
    organizationId: organizationId ?? "platform",
    bloodGroupId: group.id,
    availableUnits: countByBloodGroupId.get(group.id) ?? 0,
    lastUpdated: new Date(),
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    deletedAt: group.deletedAt,
    isDeleted: group.isDeleted,
    organization: undefined,
    bloodGroup: group,
  }));

  const result = allInventory.slice(skip, skip + limit);

  return { meta: { page, limit, total: allInventory.length }, data: result };
};

const getOrganizationInventory = async (organizationId: string) => {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId, isDeleted: false },
  });
  if (!organization) {
    throw new ApiError(httpStatus.NOT_FOUND, "Organization not found!");
  }

  return prisma.organizationBloodInventory.findMany({
    where: { organizationId, isDeleted: false },
    include: { bloodGroup: true },
    orderBy: { lastUpdated: "desc" },
  });
};

const updateInventoryItem = async (id: string, availableUnits: number) => {
  const existing = await prisma.organizationBloodInventory.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Inventory item not found!");
  }

  return prisma.organizationBloodInventory.update({
    where: { id },
    data: { availableUnits, lastUpdated: new Date() },
    include: { organization: true, bloodGroup: true },
  });
};

const deleteInventoryItem = async (id: string) => {
  const existing = await prisma.organizationBloodInventory.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Inventory item not found!");
  }

  return prisma.organizationBloodInventory.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

export const OrganizationBloodInventoryService = {
  upsertInventory,
  getAllInventory,
  getOrganizationInventory,
  updateInventoryItem,
  deleteInventoryItem,
};
