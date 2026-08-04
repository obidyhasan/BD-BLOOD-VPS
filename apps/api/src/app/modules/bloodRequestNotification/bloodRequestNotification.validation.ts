import { z } from "zod";

export const createBloodRequestNotificationZodSchema = z.object({
  requestId: z.string({ message: "Request ID is required" }).min(1),
  organizationId: z.string({ message: "Organization ID is required" }).min(1),
  smsSent: z.boolean().optional(),
});

export const updateBloodRequestNotificationZodSchema = z.object({
  smsSent: z.boolean().optional(),
});

