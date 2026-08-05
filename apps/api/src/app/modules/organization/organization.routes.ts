import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import { orgMemberAccess } from "../../middlewares/orgAccess";
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
router.get("/tree", OrganizationController.getOrganizationTree);
router.get(
  "/by-upazila/:upazilaId",
  OrganizationController.getCanonicalOrganizationByUpazila,
);
router.get("/by-slug/:slug", OrganizationController.getOrganizationBySlug);
router.get(
  "/:organizationId/donors",
  auth(Role.ADMIN, Role.DONOR),
  orgMemberAccess("params"),
  OrganizationController.getAffiliatedDonors,
);
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
