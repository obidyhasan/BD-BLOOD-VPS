import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { FaqController } from "./faq.controller";
import { createFaqZodSchema, updateFaqZodSchema } from "./faq.validation";

const router = Router();

router.get("/", FaqController.getAllFaqs);
router.get("/:id", FaqController.getSingleFaq);

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(createFaqZodSchema),
  FaqController.createFaq,
);
router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(updateFaqZodSchema),
  FaqController.updateFaq,
);
router.delete("/:id", auth(Role.ADMIN), FaqController.deleteFaq);

export const FaqRoutes = router;
