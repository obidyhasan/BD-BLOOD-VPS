import { PositionLevel, PositionStatus } from "@prisma/client";
import { z } from "zod";

export const createOrganizationPositionZodSchema = z.object({
  positionName: z.string({ message: "Position name is required" }).min(1),
  positionOrder: z.number({ message: "Position order is required" }).int().nonnegative(),
  level: z.nativeEnum(PositionLevel),
  positionStatus: z.nativeEnum(PositionStatus),
});

export const updateOrganizationPositionZodSchema = z.object({
  positionName: z.string().min(1).optional(),
  positionOrder: z.number().int().nonnegative().optional(),
  level: z.nativeEnum(PositionLevel).optional(),
  positionStatus: z.nativeEnum(PositionStatus).optional(),
});

