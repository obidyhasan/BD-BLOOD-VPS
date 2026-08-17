import { z } from "zod";
import { OrganizationStatus, VerificationStatus } from "@prisma/client";

export const createOrganizationZodSchema = z.object({
  name: z.string({ message: "Organization name is required" }).min(1),
  phone: z.string({ message: "Phone is required" }).min(1),
  email: z.string().email().optional(),
  address: z.string({ message: "Address is required" }).min(1),
  divisionId: z.string({ message: "Division ID is required" }).min(1),
  districtId: z.string({ message: "District ID is required" }).min(1),
  upazilaId: z.string({ message: "Upazila ID is required" }).min(1),
  description: z.string().optional(),
  logo: z.string().url().optional(),
  type: z.string().optional(),
  organizationStatus: z.nativeEnum(OrganizationStatus).optional(),
  verificationStatus: z.nativeEnum(VerificationStatus).optional(),
});

export const updateOrganizationZodSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  address: z.string().min(1).optional(),
  divisionId: z.string().min(1).optional(),
  districtId: z.string().min(1).optional(),
  upazilaId: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  logo: z.string().url().optional().nullable(),
  type: z.string().optional().nullable(),
  organizationStatus: z.nativeEnum(OrganizationStatus).optional(),
  verificationStatus: z.nativeEnum(VerificationStatus).optional(),
});

export const updateOrganizationVerificationZodSchema = z.object({
  verificationStatus: z.nativeEnum(VerificationStatus),
});

export const updateOrganizationProfileZodSchema = z.object({
  phone: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  address: z.string().min(1).optional(),
  description: z.string().max(3000).optional().nullable(),
  logo: z.string().url().optional().nullable(),
});

export type createOrganizationZodSchemaType = z.infer<
  typeof createOrganizationZodSchema
>;
export type updateOrganizationZodSchemaType = z.infer<
  typeof updateOrganizationZodSchema
>;
