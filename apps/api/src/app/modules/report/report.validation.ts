import { z } from "zod";
import { ReportStatus, ReportTargetType } from "@prisma/client";

export const createReportZodSchema = z.object({
  targetType: z.nativeEnum(ReportTargetType),
  targetId: z.string({ message: "Target ID is required" }).min(1),
  reason: z.string({ message: "Reason is required" }).min(1),
});

export const updateReportStatusZodSchema = z.object({
  status: z.nativeEnum(ReportStatus),
});

