import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { MedicalInstitutionService } from "./medicalInstitution.service";

const createInstitution = catchAsync(async (req: Request, res: Response) => {
  const result = await MedicalInstitutionService.createInstitution(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Medical institution created successfully!",
    data: result,
  });
});

const getAllInstitutions = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "divisionId", "districtId", "upazilaId"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await MedicalInstitutionService.getAllInstitutions(
    filters,
    options,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Medical institutions retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getInstitutionBySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await MedicalInstitutionService.getInstitutionBySlug(
    req.params.slug,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Medical institution retrieved successfully!",
    data: result,
  });
});

const getSingleInstitution = catchAsync(async (req: Request, res: Response) => {
  const result = await MedicalInstitutionService.getSingleInstitution(
    req.params.id,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Medical institution retrieved successfully!",
    data: result,
  });
});

const updateInstitution = catchAsync(async (req: Request, res: Response) => {
  const result = await MedicalInstitutionService.updateInstitution(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Medical institution updated successfully!",
    data: result,
  });
});

const deleteInstitution = catchAsync(async (req: Request, res: Response) => {
  const result = await MedicalInstitutionService.deleteInstitution(
    req.params.id,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Medical institution deleted successfully!",
    data: result,
  });
});

export const MedicalInstitutionController = {
  createInstitution,
  getAllInstitutions,
  getInstitutionBySlug,
  getSingleInstitution,
  updateInstitution,
  deleteInstitution,
};
