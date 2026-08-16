import httpStatus from "http-status";
import {
  AccountStatus,
  AvailabilityStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";

const getAllInventory = async (params: IGenericFilters, options: IOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const { organizationId, bloodGroupId, divisionId, districtId, upazilaId } =
    params as Record<string, string | undefined>;

  const donorWhereConditions: Prisma.DonorWhereInput = {
    isDeleted: false,
    accountStatus: AccountStatus.ACTIVE,
    availabilityStatus: AvailabilityStatus.AVAILABLE,
    isVerified: true,
    role: "DONOR",
    OR: [
      { nextEligibleDonationDate: null },
      { nextEligibleDonationDate: { lte: new Date() } },
    ],
    ...(bloodGroupId ? { bloodGroupId } : {}),
    ...(divisionId ? { divisionId } : {}),
    ...(districtId ? { districtId } : {}),
    ...(upazilaId ? { upazilaId } : {}),
    ...(organizationId
      ? {
          affiliations: { some: { organizationId, active: true } },
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

  const result = await getAllInventory(
    { organizationId },
    { page: 1, limit: 8, sortBy: "groupName", sortOrder: "asc" },
  );
  return result.data;
};

export const OrganizationBloodInventoryService = {
  getAllInventory,
  getOrganizationInventory,
};
