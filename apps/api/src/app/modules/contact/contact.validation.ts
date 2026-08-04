import { z } from "zod";
import { ContactMessageStatus } from "@prisma/client";

export const createContactMessageZodSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  message: z.string().min(10).max(5000),
});

export const updateContactMessageStatusZodSchema = z.object({
  status: z.enum(ContactMessageStatus),
});
