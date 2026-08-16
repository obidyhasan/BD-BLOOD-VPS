import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { MedicalInformationController } from "./medicalInformation.controller";
import {
  createMedicalInformationZodSchema,
  updateMedicalInformationZodSchema,
} from "./medicalInformation.validation";

const router = Router();

router.get("/admin/all", auth(Role.ADMIN), MedicalInformationController.getAllMedicalInformationsAdmin);
router.get("/", MedicalInformationController.getAllMedicalInformations);
router.get("/:id", MedicalInformationController.getSingleMedicalInformation);

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(createMedicalInformationZodSchema),
  MedicalInformationController.createMedicalInformation,
);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(updateMedicalInformationZodSchema),
  MedicalInformationController.updateMedicalInformation,
);

router.delete("/:id", auth(Role.ADMIN), MedicalInformationController.deleteMedicalInformation);

export const MedicalInformationRoutes = router;

