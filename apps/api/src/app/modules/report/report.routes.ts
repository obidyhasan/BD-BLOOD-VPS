import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ReportController } from "./report.controller";
import { createReportZodSchema, updateReportStatusZodSchema } from "./report.validation";

const router = Router();

router.post("/", auth(Role.ADMIN, Role.DONOR), validateRequest(createReportZodSchema), ReportController.createReport);
router.get("/me", auth(Role.ADMIN, Role.DONOR), ReportController.getMyReports);

// Admin
router.get("/", auth(Role.ADMIN), ReportController.getAllReports);
router.patch(
  "/:id/status",
  auth(Role.ADMIN),
  validateRequest(updateReportStatusZodSchema),
  ReportController.updateReportStatus,
);
router.delete("/:id", auth(Role.ADMIN), ReportController.deleteReport);

export const ReportRoutes = router;

