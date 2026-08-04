import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { IJWTPayload } from "../../types";
import { AchievementService } from "./achievement.service";
import { achievementFilterableFields } from "./achievement.constant";

const createAchievement = catchAsync(async (req: Request, res: Response) => {
  const result = await AchievementService.createAchievement(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Achievement created successfully!",
    data: result,
  });
});

const getAllAchievements = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, achievementFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await AchievementService.getAllAchievements(
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
    message: "Achievements retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getMyAchievements = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await AchievementService.getMyAchievements(
      req.user as IJWTPayload,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Your achievements retrieved successfully!",
      data: result,
    });
  },
);

const getSingleAchievement = catchAsync(async (req: Request, res: Response) => {
  const result = await AchievementService.getSingleAchievement(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Achievement retrieved successfully!",
    data: result,
  });
});

const updateAchievement = catchAsync(async (req: Request, res: Response) => {
  const result = await AchievementService.updateAchievement(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Achievement updated successfully!",
    data: result,
  });
});

const deleteAchievement = catchAsync(async (req: Request, res: Response) => {
  const result = await AchievementService.deleteAchievement(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Achievement deleted successfully!",
    data: result,
  });
});

export const AchievementController = {
  createAchievement,
  getAllAchievements,
  getMyAchievements,
  getSingleAchievement,
  updateAchievement,
  deleteAchievement,
};
