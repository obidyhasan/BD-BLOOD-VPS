import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { MedicalAdvertisementController } from "./medicalAdvertisement.controller";
import {
  createMedicalAdvertisementZodSchema,
  updateMedicalAdvertisementZodSchema,
} from "./medicalAdvertisement.validation";

const router = Router();

// Admin (must come before "/:id")
router.get("/admin/all", auth(Role.ADMIN), MedicalAdvertisementController.getAllAdsAdmin);
router.get("/admin/:id", auth(Role.ADMIN), MedicalAdvertisementController.getSingleAdAdmin);
router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(createMedicalAdvertisementZodSchema),
  MedicalAdvertisementController.createAd,
);
router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(updateMedicalAdvertisementZodSchema),
  MedicalAdvertisementController.updateAd,
);
router.delete("/:id", auth(Role.ADMIN), MedicalAdvertisementController.deleteAd);

// Public active ads
router.get("/", MedicalAdvertisementController.getAllAdsPublic);
router.get("/:id", MedicalAdvertisementController.getSingleAdPublic);

export const MedicalAdvertisementRoutes = router;

