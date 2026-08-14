import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import { PolicyController } from "./policy.controller";
import validateRequest from "../../middlewares/validateRequest";
import {
  createPolicyZodSchema,
  updatePolicyZodSchema,
} from "./policy.validation";

const router = Router();

// Public read
router.get("/", PolicyController.getAllPolicies);
router.get("/:id", PolicyController.getSinglePolicy);

// Admin write
router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(createPolicyZodSchema),
  PolicyController.createPolicy,
);
router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(updatePolicyZodSchema),
  PolicyController.updatePolicy,
);
router.delete("/:id", auth(Role.ADMIN), PolicyController.deletePolicy);

export const PolicyRoutes = router;
