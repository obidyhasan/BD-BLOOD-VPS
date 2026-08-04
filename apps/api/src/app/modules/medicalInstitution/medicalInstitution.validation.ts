import { z } from "zod";

export const createMedicalInstitutionZodSchema = z.object({
  name: z.string({ message: "Name is required" }).min(1),
  type: z.string().optional(),
  phone: z.string({ message: "Phone is required" }).min(1),
  address: z.string({ message: "Address is required" }).min(1),
  logo: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  divisionId: z.string({ message: "Division ID is required" }).min(1),
  districtId: z.string({ message: "District ID is required" }).min(1),
  upazilaId: z.string({ message: "Upazila ID is required" }).min(1),
  openStatus: z.string().optional(),
  slug: z.string().optional(),
});

export const updateMedicalInstitutionZodSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().optional(),
  phone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  logo: z.string().url().optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
  divisionId: z.string().min(1).optional(),
  districtId: z.string().min(1).optional(),
  upazilaId: z.string().min(1).optional(),
  openStatus: z.string().optional(),
  slug: z.string().optional(),
});
