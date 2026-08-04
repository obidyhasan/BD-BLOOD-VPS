import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { BloodRequestNotificationService } from "./bloodRequestNotification.service";
import { IJWTPayload } from "../../types";

const createNotificationRecord = catchAsync(async (req: Request, res: Response) => {
  const result = await BloodRequestNotificationService.createNotificationRecord(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Blood request notification created successfully!",
    data: result,
  });
});

const getAllNotificationRecords = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["requestId", "organizationId", "smsSent"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await BloodRequestNotificationService.getAllNotificationRecords(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood request notifications retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getOrganizationNotificationRecords = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const filters = pick(req.query, ["requestId", "organizationId", "smsSent"]);
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
    const result = await BloodRequestNotificationService.getOrganizationNotificationRecords(
      req.user as IJWTPayload,
      filters,
      options,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blood request notifications retrieved successfully!",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getSingleNotificationRecord = catchAsync(async (req: Request, res: Response) => {
  const result = await BloodRequestNotificationService.getSingleNotificationRecord(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood request notification retrieved successfully!",
    data: result,
  });
});

const updateNotificationRecord = catchAsync(async (req: Request, res: Response) => {
  const result = await BloodRequestNotificationService.updateNotificationRecord(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood request notification updated successfully!",
    data: result,
  });
});

const deleteNotificationRecord = catchAsync(async (req: Request, res: Response) => {
  const result = await BloodRequestNotificationService.deleteNotificationRecord(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood request notification deleted successfully!",
    data: result,
  });
});

export const BloodRequestNotificationController = {
  createNotificationRecord,
  getAllNotificationRecords,
  getOrganizationNotificationRecords,
  getSingleNotificationRecord,
  updateNotificationRecord,
  deleteNotificationRecord,
};

