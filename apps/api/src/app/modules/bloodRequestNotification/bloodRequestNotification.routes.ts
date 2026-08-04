import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { BloodRequestNotificationController } from "./bloodRequestNotification.controller";
import {
  createBloodRequestNotificationZodSchema,
  updateBloodRequestNotificationZodSchema,
} from "./bloodRequestNotification.validation";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(createBloodRequestNotificationZodSchema),
  BloodRequestNotificationController.createNotificationRecord,
);

router.get("/", auth(Role.ADMIN), BloodRequestNotificationController.getAllNotificationRecords);

router.get(
  "/organization",
  auth(Role.ADMIN, Role.DONOR),
  BloodRequestNotificationController.getOrganizationNotificationRecords,
);

router.get("/:id", auth(Role.ADMIN), BloodRequestNotificationController.getSingleNotificationRecord);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(updateBloodRequestNotificationZodSchema),
  BloodRequestNotificationController.updateNotificationRecord,
);

router.delete("/:id", auth(Role.ADMIN), BloodRequestNotificationController.deleteNotificationRecord);

export const BloodRequestNotificationRoutes = router;

