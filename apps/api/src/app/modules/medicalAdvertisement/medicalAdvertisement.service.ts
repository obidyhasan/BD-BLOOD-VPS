import httpStatus from "http-status";
import { AdStatus, Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";
import { IJWTPayload } from "../../types";

const createAd = async (payload: any, user?: IJWTPayload) => {
  const inst = await prisma.medicalInstitution.findUnique({
    where: { id: payload.institutionId, isDeleted: false },
  });
  if (!inst)
    throw new ApiError(httpStatus.NOT_FOUND, "Medical institution not found!");

  const creatorId = payload.createdBy || (await getCreatorId(user));

  return prisma.medicalAdvertisement.create({
    data: {
      institutionId: payload.institutionId,
      title: payload.title,
      imageUrl: payload.imageUrl,
      redirectUrl: payload.redirectUrl,
      startDate:
        payload.startDate instanceof Date
          ? payload.startDate
          : new Date(payload.startDate),
      endDate:
        payload.endDate instanceof Date
          ? payload.endDate
          : new Date(payload.endDate),
      status: payload.status ?? AdStatus.INACTIVE,
      createdBy: creatorId,
    },
    include: { institution: true },
  });
};

const getCreatorId = async (user?: IJWTPayload) => {
  if (!user?.email) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
  }

  const donor = await prisma.donor.findUnique({
    where: { email: user.email, isDeleted: false },
    select: { id: true },
  });

  if (!donor) {
    throw new ApiError(httpStatus.NOT_FOUND, "Creator account not found!");
  }

  return donor.id;
};

const shuffle = <T>(items: T[]) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const publicAdSelect = {
  id: true,
  title: true,
  imageUrl: true,
  institutionId: true,
  redirectUrl: true,
  startDate: true,
  endDate: true,
  status: true,
  createdAt: true,
  institution: {
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      address: true,
    },
  },
} satisfies Prisma.MedicalAdvertisementSelect;

const getAllAds = async (params: IGenericFilters, options: IOptions, onlyActive = false) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const now = new Date();
  const filters = params as Record<string, string | undefined>;
  const whereConditions: Prisma.MedicalAdvertisementWhereInput = {
    isDeleted: false,
    ...(filters.institutionId ? { institutionId: filters.institutionId } : {}),
    ...(filters.createdBy ? { createdBy: filters.createdBy } : {}),
    ...(filters.status ? { status: filters.status as AdStatus } : {}),
    ...(onlyActive
      ? {
          status: AdStatus.ACTIVE,
          startDate: { lte: now },
          endDate: { gte: now },
        }
      : {}),
  };

  const totalPromise = prisma.medicalAdvertisement.count({
    where: whereConditions,
  });

  if (onlyActive) {
    const [result, total] = await Promise.all([
      prisma.medicalAdvertisement.findMany({
        skip,
        take: limit,
        where: whereConditions,
        orderBy: { [sortBy]: sortOrder },
        select: publicAdSelect,
      }),
      totalPromise,
    ]);
    return { meta: { page, limit, total }, data: shuffle(result) };
  }

  const [result, total] = await Promise.all([
    prisma.medicalAdvertisement.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { [sortBy]: sortOrder },
      include: { institution: true },
    }),
    totalPromise,
  ]);
  return { meta: { page, limit, total }, data: result };
};

const getSingleAd = async (id: string, onlyActive = false) => {
  const where = {
    id,
    isDeleted: false,
    ...(onlyActive ? { status: AdStatus.ACTIVE } : {}),
  };

  return onlyActive
    ? prisma.medicalAdvertisement.findUniqueOrThrow({
        where,
        select: publicAdSelect,
      })
    : prisma.medicalAdvertisement.findUniqueOrThrow({
        where,
        include: { institution: true },
      });
};

const updateAd = async (
  id: string,
  payload: Prisma.MedicalAdvertisementUpdateInput,
) => {
  const existing = await prisma.medicalAdvertisement.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Medical advertisement not found!",
    );

  return prisma.medicalAdvertisement.update({
    where: { id },
    data: payload,
  });
};

const deleteAd = async (id: string) => {
  const existing = await prisma.medicalAdvertisement.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Medical advertisement not found!",
    );

  return prisma.medicalAdvertisement.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

export const MedicalAdvertisementService = {
  createAd,
  getAllAds,
  getSingleAd,
  updateAd,
  deleteAd,
};
