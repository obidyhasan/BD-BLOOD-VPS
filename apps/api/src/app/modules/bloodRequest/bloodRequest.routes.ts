import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { publicBloodRequestRateLimiter } from "../../middlewares/rateLimiter";
import { BloodRequestController } from "./bloodRequest.controller";
import {
  createBloodRequestZodSchema,
  rejectAssignmentZodSchema,
  requestReasonZodSchema,
  sendBloodRequestSmsZodSchema,
  updateBloodRequestStatusZodSchema,
} from "./bloodRequest.validation";

const router = Router();

router.post(
  "/",
  publicBloodRequestRateLimiter,
  validateRequest(createBloodRequestZodSchema),
  BloodRequestController.createRequest,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.DONOR),
  BloodRequestController.getAllRequests,
);

router.get(
  "/assignments/:assignmentId",
  auth(Role.DONOR, Role.ADMIN),
  BloodRequestController.getAssignmentForDonor,
);

router.patch(
  "/assignments/:assignmentId/accept",
  auth(Role.DONOR, Role.ADMIN),
  BloodRequestController.acceptAssignment,
);

router.patch(
  "/assignments/:assignmentId/reject",
  auth(Role.DONOR, Role.ADMIN),
  validateRequest(rejectAssignmentZodSchema),
  BloodRequestController.rejectAssignment,
);

router.post(
  "/:id/start-processing",
  auth(Role.ADMIN, Role.DONOR),
  BloodRequestController.startProcessing,
);

router.post(
  "/:id/reject",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(requestReasonZodSchema),
  BloodRequestController.rejectRequest,
);

router.post(
  "/:id/cancel-command",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(requestReasonZodSchema),
  BloodRequestController.cancelRequestCommand,
);

router.post(
  "/:id/complete-handover",
  auth(Role.ADMIN, Role.DONOR),
  BloodRequestController.completeHandover,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.DONOR),
  BloodRequestController.getSingleRequest,
);

router.get(
  "/:id/notifications",
  auth(Role.ADMIN),
  BloodRequestController.getRequestNotifications,
);

router.get(
  "/:id/eligible-donors",
  auth(Role.ADMIN, Role.DONOR),
  BloodRequestController.getEligibleDonors,
);

router.patch(
  "/:id/status",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(updateBloodRequestStatusZodSchema),
  BloodRequestController.updateRequestStatus,
);

router.post(
  "/:id/cancel",
  auth(Role.ADMIN, Role.DONOR),
  BloodRequestController.cancelRequest,
);

router.post(
  "/:id/assignments",
  auth(Role.ADMIN, Role.DONOR),
  BloodRequestController.assignDonors,
);

router.post(
  "/:id/send-sms",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(sendBloodRequestSmsZodSchema),
  BloodRequestController.sendRequesterSms,
);

router.post(
  "/:id/rematch",
  auth(Role.ADMIN),
  BloodRequestController.rematchOrganizations,
);

router.delete(
  "/:id",
  auth(Role.ADMIN, Role.DONOR),
  BloodRequestController.deleteRequest,
);

export const BloodRequestRoutes = router;
