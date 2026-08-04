import { z } from "zod";

export const createGalleryZodSchema = z.object({
  title: z.string({ message: "Title is required" }).min(1),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  coverImage: z.string().url().optional(),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
  // Omitted -> Homepage Gallery item (Admin-only; enforced server-side in
  // assertCanManageGallery). Provided -> Organization Gallery item.
  organizationId: z.string().min(1).optional(),
});

export const updateGalleryZodSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  category: z.string().min(1).optional().nullable(),
  slug: z.string().min(1).optional(),
  coverImage: z.string().url().optional().nullable(),
  images: z.array(z.string().url()).min(1).optional(),
});
