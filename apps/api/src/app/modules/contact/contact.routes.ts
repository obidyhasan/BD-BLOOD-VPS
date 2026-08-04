import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ContactController } from "./contact.controller";
import {
  createContactMessageZodSchema,
  updateContactMessageStatusZodSchema,
} from "./contact.validation";

const router = Router();

router.post(
  "/",
  validateRequest(createContactMessageZodSchema),
  ContactController.createContactMessage,
);

router.get("/", auth(Role.ADMIN), ContactController.getRecentContactMessages);

router.patch(
  "/:id/status",
  auth(Role.ADMIN),
  validateRequest(updateContactMessageStatusZodSchema),
  ContactController.updateContactMessageStatus,
);

export const ContactRoutes = router;
