import { Router } from "express";
import { LocationController } from "./location.controller";

const router = Router();

router.get("/divisions", LocationController.getAllDivisions);
router.get("/divisions/:id", LocationController.getSingleDivision);
router.get("/districts", LocationController.getAllDistricts);
router.get("/districts/:id", LocationController.getSingleDistrict);
router.get("/upazilas", LocationController.getAllUpazilas);
router.get("/upazilas/:id", LocationController.getSingleUpazila);

export const LocationRoutes = router;
