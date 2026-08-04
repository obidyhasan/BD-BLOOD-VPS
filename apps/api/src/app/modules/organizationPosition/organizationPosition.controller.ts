import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { OrganizationPositionService } from "./organizationPosition.service";

const createPosition = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationPositionService.createPosition(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Organization position created successfully!",
    data: result,
  });
});

const getAllPositions = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await OrganizationPositionService.getAllPositions({}, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization positions retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getSinglePosition = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationPositionService.getSinglePosition(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization position retrieved successfully!",
    data: result,
  });
});

const updatePosition = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationPositionService.updatePosition(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization position updated successfully!",
    data: result,
  });
});

const deletePosition = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationPositionService.deletePosition(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization position deleted successfully!",
    data: result,
  });
});

export const OrganizationPositionController = {
  createPosition,
  getAllPositions,
  getSinglePosition,
  updatePosition,
  deletePosition,
};

