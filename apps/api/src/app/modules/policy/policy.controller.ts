import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { PolicyService } from "./policy.service";
import { PolicyCategory } from "@prisma/client";
import ApiError from "../../errors/ApiError";

const createPolicy = catchAsync(async (req: Request, res: Response) => {
  const result = await PolicyService.createPolicy(req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Policy created!", data: result });
});

const getAllPolicies = catchAsync(async (req: Request, res: Response) => {
  const { category, active } = req.query;
  if (
    category !== undefined &&
    !Object.values(PolicyCategory).includes(category as PolicyCategory)
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid policy category");
  }
  if (active !== undefined && active !== "true" && active !== "false") {
    throw new ApiError(httpStatus.BAD_REQUEST, "active must be true or false");
  }
  const result = await PolicyService.getAllPolicies({
    category: category as PolicyCategory | undefined,
    active: active !== undefined ? active === "true" : undefined,
  });
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Policies fetched!", data: result });
});

const getSinglePolicy = catchAsync(async (req: Request, res: Response) => {
  const result = await PolicyService.getSinglePolicy(req.params.id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Policy fetched!", data: result });
});

const updatePolicy = catchAsync(async (req: Request, res: Response) => {
  const result = await PolicyService.updatePolicy(req.params.id, req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Policy updated!", data: result });
});

const deletePolicy = catchAsync(async (req: Request, res: Response) => {
  const result = await PolicyService.deletePolicy(req.params.id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Policy deleted!", data: result });
});

export const PolicyController = {
  createPolicy,
  getAllPolicies,
  getSinglePolicy,
  updatePolicy,
  deletePolicy,
};
