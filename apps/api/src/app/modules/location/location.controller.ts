import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import pick from "../../shared/pick";
import sendResponse from "../../shared/sendResponse";
import {
  districtFilterableFields,
  divisionFilterableFields,
  upazilaFilterableFields,
} from "./location.constant";
import { LocationService } from "./location.service";

const getAllDivisions = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, divisionFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await LocationService.getAllDivisions(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Divisions retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getSingleDivision = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LocationService.getSingleDivision(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Division retrieved successfully!",
    data: result,
  });
});

const getAllDistricts = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, districtFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await LocationService.getAllDistricts(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Districts retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getSingleDistrict = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LocationService.getSingleDistrict(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "District retrieved successfully!",
    data: result,
  });
});

const getAllUpazilas = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, upazilaFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await LocationService.getAllUpazilas(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Upazilas retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getSingleUpazila = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LocationService.getSingleUpazila(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Upazila retrieved successfully!",
    data: result,
  });
});

export const LocationController = {
  getAllDivisions,
  getSingleDivision,
  getAllDistricts,
  getSingleDistrict,
  getAllUpazilas,
  getSingleUpazila,
};
