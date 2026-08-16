import { z } from "zod";
import { BlogStatus } from "@prisma/client";

export const createBlogZodSchema = z.object({
  title: z.string({ message: "Title is required" }).min(1),
  content: z.string({ message: "Content is required" }).min(1),
  coverImage: z.string().url().optional(),
  organizationId: z.string().uuid().optional(),
});

export const updateBlogZodSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  coverImage: z.string().url().optional().nullable(),
});

export const updateBlogStatusZodSchema = z.object({
  status: z.nativeEnum(BlogStatus),
});

