import { z } from "zod";
import { AchievementThresholdType } from "@prisma/client";

export const createAchievementZodSchema = z.object({
  title: z.string({ message: "Title is required" }).min(3),
  description: z.string({ message: "Description is required" }).min(3),
  icon: z.string({ message: "Icon is required" }).min(1),
  thresholdType: z.nativeEnum(AchievementThresholdType),
  thresholdValue: z.number().int().min(1),
  active: z.boolean().optional(),
});

export const updateAchievementZodSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(3).optional(),
  icon: z.string().min(1).optional(),
  thresholdType: z.nativeEnum(AchievementThresholdType).optional(),
  thresholdValue: z.number().int().min(1).optional(),
  active: z.boolean().optional(),
});
