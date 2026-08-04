import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { MedicalInstitutionController } from "./medicalInstitution.controller";
import {
  createMedicalInstitutionZodSchema,
  updateMedicalInstitutionZodSchema,
} from "./medicalInstitution.validation";

const router = Router();

router.get("/", MedicalInstitutionController.getAllInstitutions);
router.get("/by-slug/:slug", MedicalInstitutionController.getInstitutionBySlug);
router.get("/:id", MedicalInstitutionController.getSingleInstitution);

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(createMedicalInstitutionZodSchema),
  MedicalInstitutionController.createInstitution,
);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(updateMedicalInstitutionZodSchema),
  MedicalInstitutionController.updateInstitution,
);

router.delete(
  "/:id",
  auth(Role.ADMIN),
  MedicalInstitutionController.deleteInstitution,
);

export const MedicalInstitutionRoutes = router;
