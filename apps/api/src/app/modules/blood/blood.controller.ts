import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";
import sendResponse from "../../shared/sendResponse";
import { bloodGroupFilterableFields } from "./blood.constant";
import { BloodService } from "./blood.service";

const getAllBloodGroups = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, bloodGroupFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await BloodService.getAllBloodGroups(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood groups retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getSingleBloodGroup = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BloodService.getSingleBloodGroup(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood group retrieved successfully!",
    data: result,
  });
});

export const BloodController = {
  getAllBloodGroups,
  getSingleBloodGroup,
};
