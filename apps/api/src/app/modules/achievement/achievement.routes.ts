import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AchievementController } from "./achievement.controller";
import {
  createAchievementZodSchema,
  updateAchievementZodSchema,
} from "./achievement.validation";

const router = Router();

router.get(
  "/me",
  auth(Role.ADMIN, Role.DONOR),
  AchievementController.getMyAchievements,
);

router.get("/", auth(Role.ADMIN), AchievementController.getAllAchievements);
router.get("/:id", auth(Role.ADMIN), AchievementController.getSingleAchievement);

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(createAchievementZodSchema),
  AchievementController.createAchievement,
);
router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(updateAchievementZodSchema),
  AchievementController.updateAchievement,
);
router.delete("/:id", auth(Role.ADMIN), AchievementController.deleteAchievement);

export const AchievementRoutes = router;
