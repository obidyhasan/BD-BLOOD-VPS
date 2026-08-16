import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { OrganizationBloodInventoryService } from "./organizationBloodInventory.service";
import { organizationBloodInventoryFilterableFields } from "./organizationBloodInventory.constant";

const getAllInventory = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, organizationBloodInventoryFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await OrganizationBloodInventoryService.getAllInventory(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Inventory retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getOrganizationInventory = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationBloodInventoryService.getOrganizationInventory(
    req.params.organizationId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization inventory retrieved successfully!",
    data: result,
  });
});

export const OrganizationBloodInventoryController = {
  getAllInventory,
  getOrganizationInventory,
};
