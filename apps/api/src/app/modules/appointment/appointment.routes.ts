import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AppointmentController } from "./appointment.controller";
import {
  createAppointmentZodSchema,
  updateAppointmentStatusZodSchema,
} from "./appointment.validation";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(createAppointmentZodSchema),
  AppointmentController.createAppointment,
);

router.get(
  "/me",
  auth(Role.ADMIN, Role.DONOR),
  AppointmentController.getMyAppointments,
);

router.get(
  "/organization/:organizationId",
  auth(Role.ADMIN, Role.DONOR),
  AppointmentController.getOrganizationAppointments,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.DONOR),
  AppointmentController.getSingleAppointment,
);

router.patch(
  "/:id/status",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(updateAppointmentStatusZodSchema),
  AppointmentController.updateAppointmentStatus,
);

router.delete(
  "/:id",
  auth(Role.ADMIN, Role.DONOR),
  AppointmentController.cancelAppointment,
);

export const AppointmentRoutes = router;
