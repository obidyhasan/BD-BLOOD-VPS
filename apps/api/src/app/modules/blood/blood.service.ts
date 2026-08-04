import { Prisma } from "@prisma/client";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";
import { prisma } from "../../shared/prisma";
import { cacheHelper } from "../../helper/cacheHelper";
import { bloodGroupSearchableFields } from "./blood.constant";

// Blood groups are static reference data (8 rows, changed essentially never).
// This endpoint is hit constantly — every donor registration, blood request,
// and inventory form loads it — so caching it removes real, repeated load
// from the database for zero staleness risk in practice.
const BLOOD_GROUPS_CACHE_TTL_SECONDS = 60 * 60; // 1 hour

const getAllBloodGroups = async (params: IGenericFilters, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params as Record<string, string | undefined>;

  const andConditions: Prisma.BloodGroupWhereInput[] = [{ isDeleted: false }];

  if (searchTerm) {
    andConditions.push({
      OR: bloodGroupSearchableFields.map((field) => ({
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

  const whereConditions: Prisma.BloodGroupWhereInput =
    andConditions.length > 0
      ? {
          AND: andConditions,
        }
      : {};

  const cacheKey = `bloodGroups:${JSON.stringify({ page, limit, sortBy, sortOrder, searchTerm, filterData })}`;

  return cacheHelper.getOrSetCache(cacheKey, BLOOD_GROUPS_CACHE_TTL_SECONDS, async () => {
    // Run the page fetch and the total count concurrently instead of as two
    // sequential round-trips.
    const [result, total] = await Promise.all([
      prisma.bloodGroup.findMany({
        skip,
        take: limit,
        where: whereConditions,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.bloodGroup.count({
        where: whereConditions,
      }),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
      },
      data: result,
    };
  });
};

const getSingleBloodGroup = async (id: string) => {
  const result = await prisma.bloodGroup.findUniqueOrThrow({
    where: {
      id,
      isDeleted: false,
    },
  });
  return result;
};

export const BloodService = {
  getAllBloodGroups,
  getSingleBloodGroup,
};
