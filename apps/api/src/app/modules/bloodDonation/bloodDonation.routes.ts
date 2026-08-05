import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { BloodDonationController } from "./bloodDonation.controller";
import {
  createBloodDonationZodSchema,
  donationReasonZodSchema,
  updateBloodDonationZodSchema,
  verifyBloodDonationZodSchema,
} from "./bloodDonation.validation";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(createBloodDonationZodSchema),
  BloodDonationController.createDonation,
);

router.get("/", auth(Role.ADMIN), BloodDonationController.getAllDonations);
router.get("/me", auth(Role.ADMIN, Role.DONOR), BloodDonationController.getMyDonations);
router.get(
  "/organization/:organizationId",
  auth(Role.ADMIN, Role.DONOR),
  BloodDonationController.getOrganizationDonations,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.DONOR),
  BloodDonationController.getSingleDonation,
);

router.patch(
  "/:id",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(updateBloodDonationZodSchema),
  BloodDonationController.updateDonation,
);

router.post(
  "/:id/verify",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(verifyBloodDonationZodSchema),
  BloodDonationController.verifyDonation,
);

router.post(
  "/:id/reject",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(donationReasonZodSchema),
  BloodDonationController.rejectDonation,
);

router.post(
  "/:id/reverse",
  auth(Role.ADMIN),
  validateRequest(donationReasonZodSchema),
  BloodDonationController.reverseDonation,
);

router.delete(
  "/:id",
  auth(Role.ADMIN, Role.DONOR),
  BloodDonationController.deleteDonation,
);

export const BloodDonationRoutes = router;

