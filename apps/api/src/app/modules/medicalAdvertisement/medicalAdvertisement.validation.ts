import { z } from "zod";
import { AdStatus } from "@prisma/client";

export const createMedicalAdvertisementZodSchema = z.object({
  institutionId: z.string({ message: "Institution ID is required" }).min(1),
  title: z.string({ message: "Title is required" }).min(1),
  imageUrl: z.string({ message: "Image URL is required" }).url(),
  redirectUrl: z.string().url().optional(),
  startDate: z
    .union([z.string(), z.date()])
    .transform((v) => (v instanceof Date ? v : new Date(v))),
  endDate: z
    .union([z.string(), z.date()])
    .transform((v) => (v instanceof Date ? v : new Date(v))),
  status: z.nativeEnum(AdStatus).optional(),
  createdBy: z.string().min(1).optional(),
});

export const updateMedicalAdvertisementZodSchema = z.object({
  institutionId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  imageUrl: z.string().url().optional(),
  redirectUrl: z.string().url().optional().nullable(),
  startDate: z
    .union([z.string(), z.date()])
    .optional()
    .transform((v) =>
      v === undefined ? undefined : v instanceof Date ? v : new Date(v),
    ),
  endDate: z
    .union([z.string(), z.date()])
    .optional()
    .transform((v) =>
      v === undefined ? undefined : v instanceof Date ? v : new Date(v),
    ),
  status: z.nativeEnum(AdStatus).optional(),
  createdBy: z.string().min(1).optional(),
});
