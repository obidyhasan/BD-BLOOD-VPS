import { Prisma } from "@prisma/client";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";
import { prisma } from "../../shared/prisma";
import { cacheHelper } from "../../helper/cacheHelper";
import {
  districtSearchableFields,
  divisionSearchableFields,
  upazilaSearchableFields,
} from "./location.constant";

// Bangladesh's administrative divisions/districts/upazilas are static
// reference data (this module has no create/update/delete — they're
// seed-only) but are fetched constantly by every location-dependent form
// across the app (donor registration, blood requests, inventory, etc.).
// Caching removes that repeated load for effectively zero staleness risk.
const LOCATION_CACHE_TTL_SECONDS = 60 * 60; // 1 hour

const getAllDivisions = async (params: IGenericFilters, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params as Record<string, string | undefined>;

  const andConditions: Prisma.DivisionWhereInput[] = [{ isDeleted: false }];

  if (searchTerm) {
    andConditions.push({
      OR: divisionSearchableFields.map((field) => ({
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

  const whereConditions: Prisma.DivisionWhereInput =
    andConditions.length > 0
      ? {
          AND: andConditions,
        }
      : {};

  const cacheKey = `locations:divisions:${JSON.stringify({ page, limit, sortBy, sortOrder, searchTerm, filterData })}`;

  return cacheHelper.getOrSetCache(cacheKey, LOCATION_CACHE_TTL_SECONDS, async () => {
    const [result, total] = await Promise.all([
      prisma.division.findMany({
        skip,
        take: limit,
        where: whereConditions,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.division.count({
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

const getSingleDivision = async (id: string) => {
  const result = await prisma.division.findUniqueOrThrow({
    where: {
      id,
      isDeleted: false,
    },
  });
  return result;
};

const getAllDistricts = async (params: IGenericFilters, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params as Record<string, string | undefined>;

  const andConditions: Prisma.DistrictWhereInput[] = [{ isDeleted: false }];

  if (searchTerm) {
    andConditions.push({
      OR: districtSearchableFields.map((field) => ({
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

  const whereConditions: Prisma.DistrictWhereInput =
    andConditions.length > 0
      ? {
          AND: andConditions,
        }
      : {};

  const cacheKey = `locations:districts:${JSON.stringify({ page, limit, sortBy, sortOrder, searchTerm, filterData })}`;

  return cacheHelper.getOrSetCache(cacheKey, LOCATION_CACHE_TTL_SECONDS, async () => {
    const [result, total] = await Promise.all([
      prisma.district.findMany({
        skip,
        take: limit,
        where: whereConditions,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          division: true,
        },
      }),
      prisma.district.count({
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

const getSingleDistrict = async (id: string) => {
  const result = await prisma.district.findUniqueOrThrow({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      division: true,
    },
  });
  return result;
};

const getAllUpazilas = async (params: IGenericFilters, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params as Record<string, string | undefined>;

  const andConditions: Prisma.UpazilaWhereInput[] = [{ isDeleted: false }];

  if (searchTerm) {
    andConditions.push({
      OR: upazilaSearchableFields.map((field) => ({
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

  const whereConditions: Prisma.UpazilaWhereInput =
    andConditions.length > 0
      ? {
          AND: andConditions,
        }
      : {};

  const cacheKey = `locations:upazilas:${JSON.stringify({ page, limit, sortBy, sortOrder, searchTerm, filterData })}`;

  return cacheHelper.getOrSetCache(cacheKey, LOCATION_CACHE_TTL_SECONDS, async () => {
    const [result, total] = await Promise.all([
      prisma.upazila.findMany({
        skip,
        take: limit,
        where: whereConditions,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          district: {
            include: {
              division: true,
            },
          },
        },
      }),
      prisma.upazila.count({
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

const getSingleUpazila = async (id: string) => {
  const result = await prisma.upazila.findUniqueOrThrow({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      district: {
        include: {
          division: true,
        },
      },
    },
  });
  return result;
};

export const LocationService = {
  getAllDivisions,
  getSingleDivision,
  getAllDistricts,
  getSingleDistrict,
  getAllUpazilas,
  getSingleUpazila,
};
