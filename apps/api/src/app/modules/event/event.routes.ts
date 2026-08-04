import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { EventController } from "./event.controller";
import {
  createEventZodSchema,
  joinEventZodSchema,
  updateEventZodSchema,
} from "./event.validation";

const router = Router();

router.get("/", EventController.getAllEvents);
router.get("/by-slug/:slug", EventController.getEventBySlug);
router.get("/:id", EventController.getSingleEvent);

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(createEventZodSchema),
  EventController.createEvent,
);
router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(updateEventZodSchema),
  EventController.updateEvent,
);
router.delete("/:id", auth(Role.ADMIN), EventController.deleteEvent);

router.post(
  "/:id/join",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(joinEventZodSchema),
  EventController.joinEvent,
);

router.post(
  "/:id/leave",
  auth(Role.ADMIN, Role.DONOR),
  EventController.leaveEvent,
);

router.get(
  "/:id/participants",
  auth(Role.ADMIN, Role.DONOR),
  EventController.getEventParticipants,
);

export const EventRoutes = router;
