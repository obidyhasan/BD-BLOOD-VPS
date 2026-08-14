import { PolicyCategory } from "@prisma/client";
import { z } from "zod";

export const createPolicyZodSchema = z.object({
  category: z.nativeEnum(PolicyCategory),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10_000),
  active: z.boolean().optional(),
});

export const updatePolicyZodSchema = createPolicyZodSchema.partial();
