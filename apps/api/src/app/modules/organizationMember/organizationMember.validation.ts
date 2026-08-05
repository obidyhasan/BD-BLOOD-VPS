import { z } from "zod";
import { GovernanceCategory, OrganizationMemberStatus } from "@prisma/client";

export const joinOrganizationZodSchema = z.object({
  organizationId: z.string({ message: "Organization ID is required" }).min(1),
  positionId: z.string({ message: "Position ID is required" }).min(1),
});

export const updateOrganizationMemberStatusZodSchema = z.object({
  status: z.nativeEnum(OrganizationMemberStatus),
});

export const assignOrganizationMemberZodSchema = z.object({
  donorId: z.string().min(1, "Donor ID is required"),
  positionId: z.string().min(1, "Position ID is required"),
  organizationId: z.string().optional(),
  category: z.nativeEnum(GovernanceCategory).optional(),
});

