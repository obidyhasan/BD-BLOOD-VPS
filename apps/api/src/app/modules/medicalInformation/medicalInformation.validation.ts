import { z } from "zod";
import { ArticleStatus } from "@prisma/client";

export const createMedicalInformationZodSchema = z.object({
  institutionId: z.string({ message: "Institution ID is required" }).min(1),
  title: z.string({ message: "Title is required" }).min(1),
  content: z.string({ message: "Content is required" }).min(1),
  createdBy: z.string({ message: "CreatedBy is required" }).min(1),
  status: z.nativeEnum(ArticleStatus).optional(),
});

export const updateMedicalInformationZodSchema = z.object({
  institutionId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  createdBy: z.string().min(1).optional(),
  status: z.nativeEnum(ArticleStatus).optional(),
});

