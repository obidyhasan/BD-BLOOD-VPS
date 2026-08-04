import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { IJWTPayload } from "../../types";
import { NotificationService } from "./notification.service";

const createNotification = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.createNotification(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Notification created successfully!",
    data: result,
  });
});

const broadcastNotification = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.broadcastNotification(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: `Broadcast sent to ${result.count} donors!`,
    data: result,
  });
});

const getMyNotifications = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
  const filters = pick(req.query, ["isRead", "type"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await NotificationService.getMyNotifications(req.user as IJWTPayload, filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notifications retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const markNotificationRead = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await NotificationService.markNotificationRead(
      req.user as IJWTPayload,
      req.params.id,
      req.body.isRead,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notification updated successfully!",
      data: result,
    });
  },
);

const markAllRead = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
  const result = await NotificationService.markAllRead(req.user as IJWTPayload);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notifications updated successfully!",
    data: result,
  });
});

const deleteNotification = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
  const result = await NotificationService.deleteNotification(req.user as IJWTPayload, req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification deleted successfully!",
    data: result,
  });
});

export const NotificationController = {
  createNotification,
  broadcastNotification,
  getMyNotifications,
  markNotificationRead,
  markAllRead,
  deleteNotification,
};

