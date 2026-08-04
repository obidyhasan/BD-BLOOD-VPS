import httpStatus from "http-status";
import { AccountStatus, AchievementThresholdType, Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper } from "../../helper/paginationHelper";
import { IJWTPayload } from "../../types";

type AchievementFilters = {
  thresholdType?: AchievementThresholdType;
  active?: boolean;
};

type CreateAchievementPayload = {
  title: string;
  description: string;
  icon: string;
  thresholdType: AchievementThresholdType;
  thresholdValue: number;
  active?: boolean;
};

const getDonorFromUser = async (user: IJWTPayload) => {
  const donor = await prisma.donor.findUnique({
    where: { email: user.email, isDeleted: false },
  });
  if (!donor) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }
  if (donor.accountStatus !== AccountStatus.ACTIVE) {
    throw new ApiError(httpStatus.FORBIDDEN, `User is ${donor.accountStatus}`);
  }
  return donor;
};

const createAchievement = async (payload: CreateAchievementPayload) => {
  return prisma.achievement.create({
    data: {
      title: payload.title,
      description: payload.description,
      icon: payload.icon,
      thresholdType: payload.thresholdType,
      thresholdValue: payload.thresholdValue,
      active: payload.active ?? true,
    },
  });
};

const getAllAchievements = async (params: AchievementFilters, options: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const achievementSortOrder = sortOrder as Prisma.SortOrder;

  const whereConditions: Prisma.AchievementWhereInput = {
    isDeleted: false,
    ...(params.thresholdType ? { thresholdType: params.thresholdType } : {}),
    ...(params.active !== undefined ? { active: params.active } : {}),
  };

  const [result, total] = await Promise.all([
    prisma.achievement.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { [sortBy]: achievementSortOrder },
    }),
    prisma.achievement.count({ where: whereConditions }),
  ]);

  return { meta: { page, limit, total }, data: result };
};

const getSingleAchievement = async (id: string) => {
  const achievement = await prisma.achievement.findUnique({
    where: { id, isDeleted: false },
  });

  if (!achievement) {
    throw new ApiError(httpStatus.NOT_FOUND, "Achievement not found!");
  }

  return achievement;
};

const updateAchievement = async (
  id: string,
  payload: Prisma.AchievementUpdateInput,
) => {
  const existing = await prisma.achievement.findUnique({
    where: { id, isDeleted: false },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Achievement not found!");
  }

  return prisma.achievement.update({ where: { id }, data: payload });
};

const deleteAchievement = async (id: string) => {
  const existing = await prisma.achievement.findUnique({
    where: { id, isDeleted: false },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Achievement not found!");
  }

  return prisma.achievement.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

// Donor-facing: every active achievement definition, annotated with this
// donor's own unlock status/date (from DonorAchievement rows created in
// bloodDonation.service.ts verifyDonation()).
const getMyAchievements = async (user: IJWTPayload) => {
  const donor = await getDonorFromUser(user);

  const [achievements, unlocked] = await Promise.all([
    prisma.achievement.findMany({
      where: { isDeleted: false, active: true },
      orderBy: { thresholdValue: "asc" },
    }),
    prisma.donorAchievement.findMany({
      where: { donorId: donor.id },
    }),
  ]);

  const unlockedByAchievementId = new Map(
    unlocked.map((row) => [row.achievementId, row.unlockedAt]),
  );

  return achievements.map((achievement) => ({
    ...achievement,
    unlocked: unlockedByAchievementId.has(achievement.id),
    unlockedAt: unlockedByAchievementId.get(achievement.id) ?? null,
  }));
};

export const AchievementService = {
  createAchievement,
  getAllAchievements,
  getSingleAchievement,
  updateAchievement,
  deleteAchievement,
  getMyAchievements,
};
