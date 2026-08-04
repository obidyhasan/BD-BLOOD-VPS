import { z } from "zod";

export const createOrganizationPositionZodSchema = z.object({
  positionName: z.string({ message: "Position name is required" }).min(1),
  positionOrder: z.number({ message: "Position order is required" }).int().nonnegative(),
});

export const updateOrganizationPositionZodSchema = z.object({
  positionName: z.string().min(1).optional(),
  positionOrder: z.number().int().nonnegative().optional(),
});

