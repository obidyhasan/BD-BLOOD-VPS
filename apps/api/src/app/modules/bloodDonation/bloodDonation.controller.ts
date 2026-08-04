import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { IJWTPayload } from "../../types";
import { BloodDonationService } from "./bloodDonation.service";
import { bloodDonationFilterableFields } from "./bloodDonation.constant";

const createDonation = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BloodDonationService.createDonation(
      req.user as IJWTPayload,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Donation created successfully!",
      data: result,
    });
  },
);

const getAllDonations = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, bloodDonationFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await BloodDonationService.getAllDonations(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donations retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getMyDonations = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const filters = pick(req.query, bloodDonationFilterableFields);
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

    const result = await BloodDonationService.getMyDonations(
      req.user as IJWTPayload,
      filters,
      options,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My donations retrieved successfully!",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getSingleDonation = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BloodDonationService.getSingleDonation(
      req.user as IJWTPayload,
      req.params.id,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Donation retrieved successfully!",
      data: result,
    });
  },
);

const updateDonation = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BloodDonationService.updateDonation(
      req.user as IJWTPayload,
      req.params.id,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Donation updated successfully!",
      data: result,
    });
  },
);

const verifyDonation = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BloodDonationService.verifyDonation(
      req.user as IJWTPayload,
      req.params.id,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Donation verification updated successfully!",
      data: result,
    });
  },
);

const deleteDonation = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BloodDonationService.deleteDonation(
      req.user as IJWTPayload,
      req.params.id,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Donation deleted successfully!",
      data: result,
    });
  },
);

export const BloodDonationController = {
  createDonation,
  getAllDonations,
  getMyDonations,
  getSingleDonation,
  updateDonation,
  verifyDonation,
  deleteDonation,
};

