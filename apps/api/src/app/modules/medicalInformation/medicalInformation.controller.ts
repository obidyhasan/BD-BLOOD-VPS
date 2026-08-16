import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { MedicalInformationService } from "./medicalInformation.service";
import { IJWTPayload } from "../../types";

const createMedicalInformation = catchAsync(async (req: Request & { user?: IJWTPayload }, res: Response) => {
  const result = await MedicalInformationService.createMedicalInformation(req.user as IJWTPayload, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Medical information created successfully!",
    data: result,
  });
});

const getAllMedicalInformations = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "institutionId", "divisionId", "districtId", "upazilaId"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await MedicalInformationService.getAllMedicalInformations(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Medical informations retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getAllMedicalInformationsAdmin = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "institutionId", "status", "divisionId", "districtId", "upazilaId"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await MedicalInformationService.getAllMedicalInformations(filters, options, true);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Medical information retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getSingleMedicalInformation = catchAsync(async (req: Request, res: Response) => {
  const result = await MedicalInformationService.getSingleMedicalInformation(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Medical information retrieved successfully!",
    data: result,
  });
});

const updateMedicalInformation = catchAsync(async (req: Request, res: Response) => {
  const result = await MedicalInformationService.updateMedicalInformation(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Medical information updated successfully!",
    data: result,
  });
});

const deleteMedicalInformation = catchAsync(async (req: Request, res: Response) => {
  const result = await MedicalInformationService.deleteMedicalInformation(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Medical information deleted successfully!",
    data: result,
  });
});

export const MedicalInformationController = {
  createMedicalInformation,
  getAllMedicalInformations,
  getAllMedicalInformationsAdmin,
  getSingleMedicalInformation,
  updateMedicalInformation,
  deleteMedicalInformation,
};

