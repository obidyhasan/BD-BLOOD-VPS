import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { AnalyticsService } from "./analytics.service";
import { IJWTPayload } from "../../types";

const getPlatformStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsService.getPlatformStats();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Platform statistics retrieved!",
    data: result,
  });
});

const getBloodGroupStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsService.getBloodGroupStats();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood group statistics retrieved!",
    data: result,
  });
});

const getDonorGrowthStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsService.getDonorGrowthStats();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donor growth statistics retrieved!",
    data: result,
  });
});

const getOrganizationStats = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await AnalyticsService.getOrganizationStats(
      req.user as IJWTPayload,
      req.query.organizationId as string | undefined,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Organization statistics retrieved!",
      data: result,
    });
  },
);

const getOrganizationShortages = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsService.getOrganizationShortages();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization shortage report retrieved!",
    data: result,
  });
});

const getPublicStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await AnalyticsService.getPublicStats();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Public statistics retrieved!",
    data: result,
  });
});

const getActivityFeed = catchAsync(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 20;
  const organizationId = req.query.organizationId as string | undefined;
  const result = await AnalyticsService.getActivityFeed(limit, organizationId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Activity feed retrieved!",
    data: result,
  });
});

export const AnalyticsController = {
  getPlatformStats,
  getBloodGroupStats,
  getDonorGrowthStats,
  getOrganizationStats,
  getOrganizationShortages,
  getPublicStats,
  getActivityFeed,
};
