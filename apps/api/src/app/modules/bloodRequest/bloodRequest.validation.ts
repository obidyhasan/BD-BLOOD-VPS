import { z } from "zod";
import { BloodRequestStatus, BloodRequestType } from "@prisma/client";

export const createBloodRequestZodSchema = z.object({
  requesterName: z.string({ message: "Requester name is required" }).min(1),
  requesterPhone: z.string({ message: "Requester phone is required" }).min(1),
  bloodGroupId: z.string({ message: "Blood Group ID is required" }).min(1),
  hospitalName: z.string({ message: "Hospital name is required" }).min(1),
  divisionId: z.string({ message: "Division ID is required" }).min(1),
  districtId: z.string({ message: "District ID is required" }).min(1),
  upazilaId: z.string({ message: "Upazila ID is required" }).min(1),
  organizationId: z.string().optional(),
  requiredUnits: z
    .number({ message: "Required units is required" })
    .int()
    .positive(),
  requestType: z.nativeEnum(BloodRequestType).optional(),
  message: z.string().optional(),
});

export const updateBloodRequestStatusZodSchema = z.object({
  status: z.nativeEnum(BloodRequestStatus),
});

export type createBloodRequestZodSchemaType = z.infer<
  typeof createBloodRequestZodSchema
>;
export type updateBloodRequestStatusZodSchemaType = z.infer<
  typeof updateBloodRequestStatusZodSchema
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
