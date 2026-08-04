import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { OrganizationPositionController } from "./organizationPosition.controller";
import {
  createOrganizationPositionZodSchema,
  updateOrganizationPositionZodSchema,
} from "./organizationPosition.validation";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(createOrganizationPositionZodSchema),
  OrganizationPositionController.createPosition,
);

router.get("/", OrganizationPositionController.getAllPositions);
router.get("/:id", OrganizationPositionController.getSinglePosition);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(updateOrganizationPositionZodSchema),
  OrganizationPositionController.updatePosition,
);

router.delete("/:id", auth(Role.ADMIN), OrganizationPositionController.deletePosition);

export const OrganizationPositionRoutes = router;

