import httpStatus from "http-status";
import { PositionLevel } from "@prisma/client";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { IJWTPayload } from "../../types";
import { OrganizationMemberService } from "./organizationMember.service";

const joinOrganization = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await OrganizationMemberService.joinOrganization(
      req.user as IJWTPayload,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Organization join request submitted!",
      data: result,
    });
  },
);

const getMyMembership = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await OrganizationMemberService.getMyMembership(
      req.user as IJWTPayload,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Membership retrieved successfully!",
      data: result,
    });
  },
);

const getPublicOrganizationMembers = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationMemberService.getPublicOrganizationMembers(
    req.params.organizationId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization members retrieved successfully!",
    data: result,
  });
});

const getPublicLeadershipMembers = catchAsync(async (req: Request, res: Response) => {
  const level =
    req.query.level === "MANAGEMENT"
      ? PositionLevel.MANAGEMENT
      : PositionLevel.EXECUTIVE;

  const organizationId =
    typeof req.query.organizationId === "string" && req.query.organizationId
      ? req.query.organizationId
      : undefined;
  const divisionId =
    typeof req.query.divisionId === "string" && req.query.divisionId
      ? req.query.divisionId
      : undefined;
  const districtId =
    typeof req.query.districtId === "string" && req.query.districtId
      ? req.query.districtId
      : undefined;

  const result = await OrganizationMemberService.getPublicLeadershipMembers({
    level,
    organizationId,
    divisionId,
    districtId,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Leadership members retrieved successfully!",
    data: result,
  });
});

const getAllOrganizationMembers = catchAsync(async (_req: Request, res: Response) => {
  const result = await OrganizationMemberService.getAllOrganizationMembers();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization members retrieved successfully!",
    data: result,
  });
});

const getOrganizationMembers = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
  const result = await OrganizationMemberService.getOrganizationMembers(
    req.user as IJWTPayload,
    req.params.organizationId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization members retrieved successfully!",
    data: result,
  });
});

const updateMemberStatus = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
  const result = await OrganizationMemberService.updateMemberStatus(
    req.user as IJWTPayload,
    req.params.memberId,
    req.body.status,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Member status updated successfully!",
    data: result,
  });
});

const assignOrganizationMember = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await OrganizationMemberService.assignOrganizationMember(
      req.user as IJWTPayload,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Member assigned successfully!",
      data: result,
    });
  },
);

const leaveOrganization = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await OrganizationMemberService.leaveOrganization(
      req.user as IJWTPayload,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Left organization successfully!",
      data: result,
    });
  },
);

export const OrganizationMemberController = {
  joinOrganization,
  assignOrganizationMember,
  getMyMembership,
  getPublicLeadershipMembers,
  getPublicOrganizationMembers,
  getAllOrganizationMembers,
  getOrganizationMembers,
  updateMemberStatus,
  leaveOrganization,
};

