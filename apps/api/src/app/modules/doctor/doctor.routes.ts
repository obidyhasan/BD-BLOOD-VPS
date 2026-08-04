import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { DoctorController } from "./doctor.controller";
import { createDoctorZodSchema, updateDoctorZodSchema } from "./doctor.validation";

const router = Router();

router.get("/", DoctorController.getAllDoctors);
router.get("/:id", DoctorController.getSingleDoctor);

router.post("/", auth(Role.ADMIN), validateRequest(createDoctorZodSchema), DoctorController.createDoctor);
router.patch("/:id", auth(Role.ADMIN), validateRequest(updateDoctorZodSchema), DoctorController.updateDoctor);
router.delete("/:id", auth(Role.ADMIN), DoctorController.deleteDoctor);

export const DoctorRoutes = router;

