import { Router } from "express";
import { OrganizationBloodInventoryController } from "./organizationBloodInventory.controller";

const router = Router();

router.get("/", OrganizationBloodInventoryController.getAllInventory);
router.get(
  "/organization/:organizationId",
  OrganizationBloodInventoryController.getOrganizationInventory,
);

export const OrganizationBloodInventoryRoutes = router;
