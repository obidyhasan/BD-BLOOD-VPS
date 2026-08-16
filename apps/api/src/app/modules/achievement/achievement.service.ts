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

const assertUniqueThreshold = async (
  thresholdType: AchievementThresholdType,
  thresholdValue: number,
  excludeId?: string,
) => {
  const duplicate = await prisma.achievement.findFirst({
    where: {
      thresholdType,
      thresholdValue,
      isDeleted: false,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (duplicate) throw new ApiError(httpStatus.CONFLICT, "An achievement already uses this donation threshold.");
};

const reconcileAchievement = async (
  tx: Prisma.TransactionClient,
  achievement: { id: string; thresholdType: AchievementThresholdType; thresholdValue: number; active: boolean },
) => {
  if (!achievement.active) {
    await tx.donorAchievement.deleteMany({ where: { achievementId: achievement.id } });
    return;
  }
  const donors = await tx.donor.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      _count: {
        select: {
          donations: {
            where: {
              isDeleted: false,
              ...(achievement.thresholdType === AchievementThresholdType.VERIFIED_DONATIONS
                ? { verificationStatus: "VERIFIED" }
                : {}),
            },
          },
        },
      },
    },
  });
  const eligibleIds = donors.filter((donor) => donor._count.donations >= achievement.thresholdValue).map((donor) => donor.id);
  await tx.donorAchievement.deleteMany({ where: { achievementId: achievement.id, ...(eligibleIds.length ? { donorId: { notIn: eligibleIds } } : {}) } });
  if (eligibleIds.length) await tx.donorAchievement.createMany({ data: eligibleIds.map((donorId) => ({ donorId, achievementId: achievement.id })), skipDuplicates: true });
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
  await assertUniqueThreshold(payload.thresholdType, payload.thresholdValue);
  return prisma.$transaction(async (tx) => {
    const achievement = await tx.achievement.create({ data: {
      title: payload.title,
      description: payload.description,
      icon: payload.icon,
      thresholdType: payload.thresholdType,
      thresholdValue: payload.thresholdValue,
      active: payload.active ?? true,
    } });
    await reconcileAchievement(tx, achievement);
    return achievement;
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
  payload: Partial<CreateAchievementPayload>,
) => {
  const existing = await prisma.achievement.findUnique({
    where: { id, isDeleted: false },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Achievement not found!");
  }

  const thresholdType = payload.thresholdType ?? existing.thresholdType;
  const thresholdValue = payload.thresholdValue ?? existing.thresholdValue;
  await assertUniqueThreshold(thresholdType, thresholdValue, id);
  return prisma.$transaction(async (tx) => {
    const achievement = await tx.achievement.update({ where: { id }, data: payload });
    await reconcileAchievement(tx, achievement);
    return achievement;
  });
};

const deleteAchievement = async (id: string) => {
  const existing = await prisma.achievement.findUnique({
    where: { id, isDeleted: false },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Achievement not found!");
  }

  return prisma.$transaction(async (tx) => {
    await tx.donorAchievement.deleteMany({ where: { achievementId: id } });
    return tx.achievement.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), active: false },
    });
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
