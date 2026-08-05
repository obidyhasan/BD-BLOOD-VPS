import { z } from "zod";
import { VerificationStatus } from "@prisma/client";

export const createBloodDonationZodSchema = z.object({
  recipientName: z.string().optional(),
  hospitalName: z.string().min(1).optional(),
  divisionId: z.string().min(1).optional(),
  districtId: z.string().min(1).optional(),
  upazilaId: z.string().min(1).optional(),
  organizationId: z.string().optional(),
  // Optional link to the RequestAssignment this donation fulfills.
  requestAssignmentId: z.string().optional(),
  donationDate: z
    .union([z.string(), z.date()])
    .transform((v) => (v instanceof Date ? v : new Date(v))),
  notes: z.string().optional(),
}).superRefine((data, context) => {
  if (data.requestAssignmentId) return;
  for (const field of ["hospitalName", "divisionId", "districtId", "upazilaId"] as const) {
    if (!data[field]) {
      context.addIssue({
        code: "custom",
        path: [field],
        message: `${field} is required for an independent donation`,
      });
    }
  }
});

export const updateBloodDonationZodSchema = z.object({
  recipientName: z.string().optional(),
  hospitalName: z.string().min(1).optional(),
  divisionId: z.string().min(1).optional(),
  districtId: z.string().min(1).optional(),
  upazilaId: z.string().min(1).optional(),
  organizationId: z.string().optional().nullable(),
  requestAssignmentId: z.string().optional().nullable(),
  donationDate: z
    .union([z.string(), z.date()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v instanceof Date ? v : new Date(v))),
  notes: z.string().optional(),
});

export const verifyBloodDonationZodSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const donationReasonZodSchema = z.object({
  reason: z.string({ message: "Reason is required" }).min(3).max(500),
});

export type createBloodDonationZodSchemaType = z.infer<
  typeof createBloodDonationZodSchema
>;
export type updateBloodDonationZodSchemaType = z.infer<
  typeof updateBloodDonationZodSchema
>;
export type verifyBloodDonationZodSchemaType = z.infer<
  typeof verifyBloodDonationZodSchema
>;

