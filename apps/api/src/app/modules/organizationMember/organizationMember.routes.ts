import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import { orgMemberAccess } from "../../middlewares/orgAccess";
import validateRequest from "../../middlewares/validateRequest";
import { OrganizationMemberController } from "./organizationMember.controller";
import {
  assignOrganizationMemberZodSchema,
  joinOrganizationZodSchema,
  updateOrganizationMemberStatusZodSchema,
} from "./organizationMember.validation";

const router = Router();

router.post(
  "/join",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(joinOrganizationZodSchema),
  OrganizationMemberController.joinOrganization,
);

router.get("/me", auth(Role.ADMIN, Role.DONOR), OrganizationMemberController.getMyMembership);

router.get(
  "/public/leadership",
  OrganizationMemberController.getPublicLeadershipMembers,
);

router.get(
  "/organization/:organizationId/public",
  OrganizationMemberController.getPublicOrganizationMembers,
);

router.get(
  "/admin/all",
  auth(Role.ADMIN),
  OrganizationMemberController.getAllOrganizationMembers,
);

router.get(
  "/organization/:organizationId",
  auth(Role.ADMIN, Role.DONOR),
  orgMemberAccess("params"),
  OrganizationMemberController.getOrganizationMembers,
);

router.patch(
  "/:memberId/status",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(updateOrganizationMemberStatusZodSchema),
  OrganizationMemberController.updateMemberStatus,
);

router.post(
  "/assign",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(assignOrganizationMemberZodSchema),
  OrganizationMemberController.assignOrganizationMember,
);

router.post("/leave", auth(Role.ADMIN, Role.DONOR), OrganizationMemberController.leaveOrganization);

export const OrganizationMemberRoutes = router;

