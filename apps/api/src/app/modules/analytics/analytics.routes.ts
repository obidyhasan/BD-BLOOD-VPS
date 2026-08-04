import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import { AnalyticsController } from "./analytics.controller";

const router = Router();

router.get("/public-stats", AnalyticsController.getPublicStats);
router.get("/activity-feed", auth(Role.ADMIN, Role.DONOR), AnalyticsController.getActivityFeed);

router.get("/stats", auth(Role.ADMIN), AnalyticsController.getPlatformStats);
router.get("/blood-groups", auth(Role.ADMIN), AnalyticsController.getBloodGroupStats);
router.get("/donor-growth", auth(Role.ADMIN), AnalyticsController.getDonorGrowthStats);
router.get(
  "/organization-stats",
  auth(Role.ADMIN, Role.DONOR),
  AnalyticsController.getOrganizationStats,
);

router.get(
  "/organization-shortages",
  auth(Role.ADMIN),
  AnalyticsController.getOrganizationShortages,
);

export const AnalyticsRoutes = router;
