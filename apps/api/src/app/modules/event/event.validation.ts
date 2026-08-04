import { z } from "zod";
import { EventType, ParticipationType } from "@prisma/client";

export const createEventZodSchema = z.object({
  organizationId: z.string({ message: "Organization ID is required" }).min(1),
  title: z.string({ message: "Title is required" }).min(1),
  description: z.string().optional(),
  eventType: z.nativeEnum(EventType),
  eventDate: z
    .union([z.string(), z.date()])
    .transform((v) => (v instanceof Date ? v : new Date(v))),
  eventTime: z.string().optional(),
  slots: z.string().optional(),
  divisionId: z.string({ message: "Division ID is required" }).min(1),
  districtId: z.string({ message: "District ID is required" }).min(1),
  upazilaId: z.string({ message: "Upazila ID is required" }).min(1),
  locationDetails: z.string().optional(),
  slug: z.string().optional(),
});

export const updateEventZodSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  eventType: z.nativeEnum(EventType).optional(),
  eventDate: z
    .union([z.string(), z.date()])
    .optional()
    .transform((v) =>
      v === undefined ? undefined : v instanceof Date ? v : new Date(v),
    ),
  divisionId: z.string().min(1).optional(),
  districtId: z.string().min(1).optional(),
  upazilaId: z.string().min(1).optional(),
  locationDetails: z.string().optional().nullable(),
});

export const joinEventZodSchema = z.object({
  participationType: z.nativeEnum(ParticipationType),
});
