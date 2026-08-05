import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { IJWTPayload } from "../../types";
import { MedicalAdvertisementService } from "./medicalAdvertisement.service";

const createAd = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await MedicalAdvertisementService.createAd(
      req.body,
      req.user as IJWTPayload,
    );
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Medical advertisement created successfully!",
      data: result,
    });
  },
);

const getAllAdsPublic = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["institutionId"]);
  const options = {
    ...pick(req.query, ["page", "sortBy", "sortOrder"]),
    limit: Math.min(Math.max(Number(req.query.limit) || 8, 1), 12),
  };
  const result = await MedicalAdvertisementService.getAllAds(
    filters,
    options,
    true,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Medical advertisements retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getAllAdsAdmin = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["institutionId", "createdBy", "status"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await MedicalAdvertisementService.getAllAds(
    filters,
    options,
    false,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Medical advertisements retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getSingleAdPublic = catchAsync(async (req: Request, res: Response) => {
  const result = await MedicalAdvertisementService.getSingleAd(
    req.params.id,
    true,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Medical advertisement retrieved successfully!",
    data: result,
  });
});

const getSingleAdAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await MedicalAdvertisementService.getSingleAd(
    req.params.id,
    false,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Medical advertisement retrieved successfully!",
    data: result,
  });
});

const updateAd = catchAsync(async (req: Request, res: Response) => {
  const result = await MedicalAdvertisementService.updateAd(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Medical advertisement updated successfully!",
    data: result,
  });
});

const deleteAd = catchAsync(async (req: Request, res: Response) => {
  const result = await MedicalAdvertisementService.deleteAd(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Medical advertisement deleted successfully!",
    data: result,
  });
});

export const MedicalAdvertisementController = {
  createAd,
  getAllAdsPublic,
  getAllAdsAdmin,
  getSingleAdPublic,
  getSingleAdAdmin,
  updateAd,
  deleteAd,
};
