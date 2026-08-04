import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { UserService } from "./user.service";
import { AuthService } from "../auth/auth.service";
import {
  publicDonorFilterableFields,
  userFilterableFields,
} from "./user.constant";
import pick from "../../shared/pick";
import { IJWTPayload } from "../../types";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createUser(req.body);

  await AuthService.sendVerificationEmail(result.email);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message:
      "Registration successful. Enter the 6-digit verification code sent to your email to activate your account.",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, userFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await UserService.getAllUsers(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User retrieve successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getSingleUser(req.params.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User retrieve successfully!",
    data: result,
  });
});

const getMyProfile = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const result = await UserService.getMyProfile(user as IJWTPayload);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My profile data fetch successfully!",
      data: result,
    });
  },
);

const updateMyProfile = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const body = { ...req.body } as Record<string, unknown>;
    if (typeof body.notifyInApp === "string")
      body.notifyInApp = body.notifyInApp === "true";
    if (typeof body.notifySms === "string")
      body.notifySms = body.notifySms === "true";
    if (typeof body.notifyEmail === "string")
      body.notifyEmail = body.notifyEmail === "true";

    const payload: Record<string, unknown> = { ...body };
    if (req.file?.path) {
      payload.profilePhoto = req.file.path;
    }
    const result = await UserService.updateMyProfile(
      user as IJWTPayload,
      payload,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My profile updated successfully!",
      data: result,
    });
  },
);

const deleteUser = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user;
    const result = await UserService.deleteUser(user as IJWTPayload);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User deleted successfully!",
      data: result,
    });
  },
);

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getUserById(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User retrieved successfully!",
    data: result,
  });
});

const adminUpdateUserById = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.adminUpdateUserById(req.params.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User updated successfully!",
    data: result,
  });
});

const getPublicDonors = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, publicDonorFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await UserService.getPublicDonors(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donors retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getPublicDonorBySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getPublicDonorBySlug(req.params.slug);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donor retrieved successfully!",
    data: result,
  });
});

const getPublicDonorById = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getPublicDonorById(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Donor retrieved successfully!",
    data: result,
  });
});

export const UserController = {
  createUser,
  getAllUsers,
  getMyProfile,
  updateMyProfile,
  getSingleUser,
  deleteUser,
  getUserById,
  adminUpdateUserById,
  getPublicDonors,
  getPublicDonorById,
  getPublicDonorBySlug,
};
