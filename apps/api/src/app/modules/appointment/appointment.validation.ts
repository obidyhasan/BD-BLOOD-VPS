import { z } from "zod";
import { AppointmentStatus } from "@prisma/client";

export const createAppointmentZodSchema = z.object({
  organizationId: z.string().uuid(),
  eventId: z.string().uuid().optional(),
  bloodGroupId: z.string().uuid().optional(),
  scheduledAt: z.union([z.string(), z.date()]),
  notes: z.string().optional(),
});

export const updateAppointmentStatusZodSchema = z.object({
  status: z.nativeEnum(AppointmentStatus),
  notes: z.string().optional(),
});

export const AppointmentValidation = {
  createAppointmentZodSchema,
  updateAppointmentStatusZodSchema,
};
