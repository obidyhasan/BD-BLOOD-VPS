import express from "express";
import { BloodController } from "./blood.controller";

const router = express.Router();

router.get("/groups", BloodController.getAllBloodGroups);
router.get("/groups/:id", BloodController.getSingleBloodGroup);

export const BloodRoutes = router;
