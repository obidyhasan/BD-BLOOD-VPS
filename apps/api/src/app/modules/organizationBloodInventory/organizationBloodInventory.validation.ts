import { z } from "zod";

export const upsertOrganizationBloodInventoryZodSchema = z.object({
  organizationId: z.string({ message: "Organization ID is required" }).min(1),
  bloodGroupId: z.string({ message: "Blood group ID is required" }).min(1),
  availableUnits: z
    .number({ message: "Available units is required" })
    .int()
    .nonnegative(),
});

export const updateOrganizationBloodInventoryZodSchema = z.object({
  availableUnits: z.number().int().nonnegative(),
});

