import { z } from "zod";
import { BloodRequestType } from "@prisma/client";

const bdPhoneSchema = z
  .string({ message: "Requester phone is required" })
  .trim()
  .regex(/^(?:\+?88)?01[3-9]\d{8}$/, "Enter a valid Bangladesh phone number");

export const createBloodRequestZodSchema = z.object({
  requesterName: z.string({ message: "Requester name is required" }).min(1),
  requesterPhone: bdPhoneSchema,
  bloodGroupId: z.string({ message: "Blood Group ID is required" }).min(1),
  hospitalName: z.string({ message: "Hospital name is required" }).min(1),
  divisionId: z.string({ message: "Division ID is required" }).min(1),
  districtId: z.string({ message: "District ID is required" }).min(1),
  upazilaId: z.string({ message: "Upazila ID is required" }).min(1),
  organizationId: z.string().optional(),
  requiredUnits: z
    .number({ message: "Required units is required" })
    .int()
    .min(1)
    .max(10, "A public request can contain at most 10 bags"),
  requestType: z.nativeEnum(BloodRequestType).optional(),
  message: z.string().optional(),
});

export type createBloodRequestZodSchemaType = z.infer<
  typeof createBloodRequestZodSchema
>;

export const sendBloodRequestSmsZodSchema = z.object({
  message: z.string({ message: "Message is required" }).min(1).max(500),
});

export type sendBloodRequestSmsZodSchemaType = z.infer<
  typeof sendBloodRequestSmsZodSchema
>;

export const assignDonorsZodSchema = z.object({}).optional();

export const rejectAssignmentZodSchema = z.object({
  rejectionReason: z.string().max(500).optional(),
});

export type assignDonorsZodSchemaType = z.infer<typeof assignDonorsZodSchema>;
export type rejectAssignmentZodSchemaType = z.infer<
  typeof rejectAssignmentZodSchema
>;

export const requestReasonZodSchema = z.object({
  reason: z.string({ message: "Reason is required" }).min(3).max(500),
});

export const withdrawAssignmentZodSchema = requestReasonZodSchema;
