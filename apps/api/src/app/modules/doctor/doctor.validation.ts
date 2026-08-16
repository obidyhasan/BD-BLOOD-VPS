import { z } from "zod";

export const createDoctorZodSchema = z.object({
  institutionId: z.string({ message: "Institution ID is required" }).min(1),
  name: z.string({ message: "Name is required" }).min(1),
  specialization: z.string({ message: "Specialization is required" }).min(1),
  phone: z.string({ message: "Phone is required" }).min(1),
  visitingHours: z.string().optional(),
  experience: z.string().optional(),
});

export const updateDoctorZodSchema = z.object({
  institutionId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  specialization: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  visitingHours: z.string().optional().nullable(),
  experience: z.string().optional().nullable(),
});

