import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { GalleryService } from "./gallery.service";

import { assertCanManageGallery } from "../../middlewares/orgAccess";
import { IJWTPayload } from "../../types";

const createGallery = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    await assertCanManageGallery(
      req.user as IJWTPayload,
      undefined,
      req.body.organizationId,
    );
    const result = await GalleryService.createGallery(req.body);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Gallery created successfully!",
      data: result,
    });
  },
);

const getAllGalleries = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["organizationId", "scope"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await GalleryService.getAllGalleries(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Galleries retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getGalleryBySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await GalleryService.getGalleryBySlug(req.params.slug);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Gallery retrieved successfully!",
    data: result,
  });
});

const getSingleGallery = catchAsync(async (req: Request, res: Response) => {
  const result = await GalleryService.getSingleGallery(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Gallery retrieved successfully!",
    data: result,
  });
});

const updateGallery = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    await assertCanManageGallery(req.user as IJWTPayload, req.params.id);
    const result = await GalleryService.updateGallery(req.params.id, req.body);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Gallery updated successfully!",
      data: result,
    });
  },
);

const deleteGallery = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    await assertCanManageGallery(req.user as IJWTPayload, req.params.id);
    const result = await GalleryService.deleteGallery(req.params.id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Gallery deleted successfully!",
      data: result,
    });
  },
);

export const GalleryController = {
  createGallery,
  getAllGalleries,
  getGalleryBySlug,
  getSingleGallery,
  updateGallery,
  deleteGallery,
};
