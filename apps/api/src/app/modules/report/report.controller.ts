import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { IJWTPayload } from "../../types";
import { ReportService } from "./report.service";

const createReport = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
  const result = await ReportService.createReport(req.user as IJWTPayload, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Report submitted successfully!",
    data: result,
  });
});

const getAllReports = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["status", "targetType", "reportedBy"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await ReportService.getAllReports(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Reports retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getMyReports = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
  const filters = pick(req.query, ["status", "targetType"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await ReportService.getMyReports(req.user as IJWTPayload, filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My reports retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const updateReportStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportService.updateReportStatus(req.params.id, req.body.status);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Report status updated successfully!",
    data: result,
  });
});

const deleteReport = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportService.deleteReport(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Report deleted successfully!",
    data: result,
  });
});

export const ReportController = {
  createReport,
  getAllReports,
  getMyReports,
  updateReportStatus,
  deleteReport,
};

