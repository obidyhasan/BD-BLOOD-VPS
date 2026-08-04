import { z } from "zod";

export const createFaqZodSchema = z.object({
  question: z.string({ message: "Question is required" }).min(3),
  answer: z.string({ message: "Answer is required" }).min(3),
  category: z.string().min(1).optional(),
  active: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const updateFaqZodSchema = z.object({
  question: z.string().min(3).optional(),
  answer: z.string().min(3).optional(),
  category: z.string().min(1).optional().nullable(),
  active: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});
