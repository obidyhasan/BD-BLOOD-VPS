import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { assertCanManageInventoryItem } from "../../middlewares/orgAccess";
import { IJWTPayload } from "../../types";
import { OrganizationBloodInventoryService } from "./organizationBloodInventory.service";
import { organizationBloodInventoryFilterableFields } from "./organizationBloodInventory.constant";

const upsertInventory = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationBloodInventoryService.upsertInventory(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Inventory updated successfully!",
    data: result,
  });
});

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

const updateInventoryItem = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
  await assertCanManageInventoryItem(req.user as IJWTPayload, req.params.id);

  const result = await OrganizationBloodInventoryService.updateInventoryItem(
    req.params.id,
    req.body.availableUnits,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Inventory item updated successfully!",
    data: result,
  });
});

const deleteInventoryItem = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationBloodInventoryService.deleteInventoryItem(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Inventory item deleted successfully!",
    data: result,
  });
});

export const OrganizationBloodInventoryController = {
  upsertInventory,
  getAllInventory,
  getOrganizationInventory,
  updateInventoryItem,
  deleteInventoryItem,
};

