import { z } from "zod";
import { NotificationPriority, NotificationType } from "@prisma/client";

export const createNotificationZodSchema = z.object({
  donorId: z.string({ message: "Donor ID is required" }).min(1),
  title: z.string({ message: "Title is required" }).min(1),
  message: z.string({ message: "Message is required" }).min(1),
  type: z.nativeEnum(NotificationType),
  priority: z.nativeEnum(NotificationPriority).optional(),
});

export const broadcastNotificationZodSchema = z.object({
  title: z.string({ message: "Title is required" }).min(1),
  message: z.string({ message: "Message is required" }).min(1),
  type: z.nativeEnum(NotificationType),
  priority: z.nativeEnum(NotificationPriority).optional(),
});

export const markNotificationReadZodSchema = z.object({
  isRead: z.boolean(),
});

