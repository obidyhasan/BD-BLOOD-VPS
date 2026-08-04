import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { NotificationController } from "./notification.controller";
import {
  broadcastNotificationZodSchema,
  createNotificationZodSchema,
  markNotificationReadZodSchema,
} from "./notification.validation";

const router = Router();

router.get("/me", auth(Role.ADMIN, Role.DONOR), NotificationController.getMyNotifications);
router.patch(
  "/:id/read",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(markNotificationReadZodSchema),
  NotificationController.markNotificationRead,
);
router.post("/me/read-all", auth(Role.ADMIN, Role.DONOR), NotificationController.markAllRead);
router.delete("/:id", auth(Role.ADMIN, Role.DONOR), NotificationController.deleteNotification);

// Admin/system
router.post(
  "/broadcast",
  auth(Role.ADMIN),
  validateRequest(broadcastNotificationZodSchema),
  NotificationController.broadcastNotification,
);

router.post("/", auth(Role.ADMIN), validateRequest(createNotificationZodSchema), NotificationController.createNotification);

export const NotificationRoutes = router;

