import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Please enter your email or phone number"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});
