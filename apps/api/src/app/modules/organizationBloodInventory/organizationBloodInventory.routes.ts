import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import { orgMemberAccess } from "../../middlewares/orgAccess";
import validateRequest from "../../middlewares/validateRequest";
import { OrganizationBloodInventoryController } from "./organizationBloodInventory.controller";
import {
  upsertOrganizationBloodInventoryZodSchema,
  updateOrganizationBloodInventoryZodSchema,
} from "./organizationBloodInventory.validation";

const router = Router();

router.get("/", OrganizationBloodInventoryController.getAllInventory);
router.get(
  "/organization/:organizationId",
  OrganizationBloodInventoryController.getOrganizationInventory,
);

router.post(
  "/upsert",
  auth(Role.ADMIN, Role.DONOR),
  orgMemberAccess("body"),
  validateRequest(upsertOrganizationBloodInventoryZodSchema),
  OrganizationBloodInventoryController.upsertInventory,
);

router.patch(
  "/:id",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(updateOrganizationBloodInventoryZodSchema),
  OrganizationBloodInventoryController.updateInventoryItem,
);

router.delete("/:id", auth(Role.ADMIN), OrganizationBloodInventoryController.deleteInventoryItem);

export const OrganizationBloodInventoryRoutes = router;

