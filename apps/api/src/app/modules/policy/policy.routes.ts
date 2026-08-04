import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import { PolicyController } from "./policy.controller";

const router = Router();

// Public read
router.get("/", PolicyController.getAllPolicies);
router.get("/:id", PolicyController.getSinglePolicy);

// Admin write
router.post("/", auth(Role.ADMIN), PolicyController.createPolicy);
router.patch("/:id", auth(Role.ADMIN), PolicyController.updatePolicy);
router.delete("/:id", auth(Role.ADMIN), PolicyController.deletePolicy);

export const PolicyRoutes = router;
