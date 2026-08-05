import { z } from "zod";
import { ApprovalStatus, PostType, PostVisibility } from "@prisma/client";

const imagesField = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") return undefined;
  if (Array.isArray(val)) return val;
  return [val];
}, z.array(z.string().url()).optional());

export const createPostZodSchema = z.object({
  organizationId: z.string().optional().nullable(),
  donationId: z.string().uuid().optional().nullable(),
  postType: z.nativeEnum(PostType),
  title: z.string({ message: "Title is required" }).min(1),
  content: z.string({ message: "Content is required" }).min(1),
  visibility: z.nativeEnum(PostVisibility).optional(),
  images: imagesField,
});

export const updatePostZodSchema = z.object({
  organizationId: z.string().optional().nullable(),
  donationId: z.string().uuid().optional().nullable(),
  postType: z.nativeEnum(PostType).optional(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  visibility: z.nativeEnum(PostVisibility).optional(),
  images: imagesField,
});

export const updatePostApprovalZodSchema = z.object({
  approvalStatus: z.nativeEnum(ApprovalStatus).optional(),
  isWork: z.boolean().optional(),
});

export const createPostCommentZodSchema = z.object({
  content: z.string({ message: "Comment is required" }).min(1).max(2000),
  parentId: z.string().uuid().optional().nullable(),
});
