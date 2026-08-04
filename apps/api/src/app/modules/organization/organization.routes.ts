import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { OrganizationController } from "./organization.controller";
import {
  createOrganizationZodSchema,
  updateOrganizationVerificationZodSchema,
  updateOrganizationZodSchema,
} from "./organization.validation";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(createOrganizationZodSchema),
  OrganizationController.createOrganization,
);

router.post(
  "/register",
  auth(Role.DONOR, Role.ADMIN),
  validateRequest(createOrganizationZodSchema),
  OrganizationController.registerOrganization,
);

router.get("/", OrganizationController.getAllOrganizations);
router.get("/by-slug/:slug", OrganizationController.getOrganizationBySlug);
router.get("/:id", OrganizationController.getSingleOrganization);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(updateOrganizationZodSchema),
  OrganizationController.updateOrganization,
);

router.patch(
  "/:id/verify",
  auth(Role.ADMIN),
  validateRequest(updateOrganizationVerificationZodSchema),
  OrganizationController.updateOrganizationVerification,
);

router.delete(
  "/:id",
  auth(Role.ADMIN),
  OrganizationController.deleteOrganization,
);

export const OrganizationRoutes = router;
