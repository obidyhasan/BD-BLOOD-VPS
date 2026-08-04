import { z } from "zod";

export const donorRegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),

  email: z.string().email("Please enter a valid email address"),

  number: z
    .string()
    .regex(/^01[0-9]{9}$/, "Please enter a valid Bangladeshi phone number"),

  bloodGroup: z.string().min(1, "Please select a valid blood group"),
  reference: z
    .string()
    .email("Reference must be a valid email address")
    .optional()
    .or(z.literal("")),

  password: z.string().min(6, "Password must be at least 6 characters long"),
});
