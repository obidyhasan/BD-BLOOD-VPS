import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { FaqService } from "./faq.service";

const createFaq = catchAsync(async (req: Request, res: Response) => {
  const result = await FaqService.createFaq(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "FAQ created successfully!",
    data: result,
  });
});

const getAllFaqs = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["category", "active"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await FaqService.getAllFaqs(
    {
      ...filters,
      active:
        filters.active !== undefined
          ? String(filters.active) === "true"
          : undefined,
    },
    options,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "FAQs retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getSingleFaq = catchAsync(async (req: Request, res: Response) => {
  const result = await FaqService.getSingleFaq(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "FAQ retrieved successfully!",
    data: result,
  });
});

const updateFaq = catchAsync(async (req: Request, res: Response) => {
  const result = await FaqService.updateFaq(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "FAQ updated successfully!",
    data: result,
  });
});

const deleteFaq = catchAsync(async (req: Request, res: Response) => {
  const result = await FaqService.deleteFaq(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "FAQ deleted successfully!",
    data: result,
  });
});

export const FaqController = {
  createFaq,
  getAllFaqs,
  getSingleFaq,
  updateFaq,
  deleteFaq,
};
