import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { DoctorService } from "./doctor.service";

const createDoctor = catchAsync(async (req: Request, res: Response) => {
  const result = await DoctorService.createDoctor(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Doctor created successfully!",
    data: result,
  });
});

const getAllDoctors = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "institutionId", "divisionId", "districtId", "upazilaId"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await DoctorService.getAllDoctors(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Doctors retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getSingleDoctor = catchAsync(async (req: Request, res: Response) => {
  const result = await DoctorService.getSingleDoctor(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Doctor retrieved successfully!",
    data: result,
  });
});

const updateDoctor = catchAsync(async (req: Request, res: Response) => {
  const result = await DoctorService.updateDoctor(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Doctor updated successfully!",
    data: result,
  });
});

const deleteDoctor = catchAsync(async (req: Request, res: Response) => {
  const result = await DoctorService.deleteDoctor(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Doctor deleted successfully!",
    data: result,
  });
});

export const DoctorController = {
  createDoctor,
  getAllDoctors,
  getSingleDoctor,
  updateDoctor,
  deleteDoctor,
};

