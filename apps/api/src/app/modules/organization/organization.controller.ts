import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { OrganizationService } from "./organization.service";
import { organizationFilterableFields } from "./organization.constant";
import { IJWTPayload } from "../../types";
import ApiError from "../../errors/ApiError";

const createOrganization = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationService.createOrganization(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Organization created successfully!",
    data: result,
  });
});

const registerOrganization = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    if (!req.user?.email) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }
    const result = await OrganizationService.registerOrganization(
      req.body,
      req.user.email,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Organization registered successfully and awaits verification!",
      data: result,
    });
  },
);

const getAllOrganizations = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, organizationFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await OrganizationService.getAllOrganizations(
    filters,
    options,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organizations retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getOrganizationBySlug = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OrganizationService.getOrganizationBySlug(
      req.params.slug,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Organization retrieved successfully!",
      data: result,
    });
  },
);

const getSingleOrganization = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OrganizationService.getSingleOrganization(
      req.params.id,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Organization retrieved successfully!",
      data: result,
    });
  },
);

const updateOrganization = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationService.updateOrganization(
    req.params.id,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization updated successfully!",
    data: result,
  });
});

const updateOrganizationVerification = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OrganizationService.updateOrganizationVerification(
      req.params.id,
      req.body.verificationStatus,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Organization verification updated successfully!",
      data: result,
    });
  },
);

const deleteOrganization = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationService.deleteOrganization(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization deleted successfully!",
    data: result,
  });
});

const getOrganizationTree = catchAsync(async (_req: Request, res: Response) => {
  const result = await OrganizationService.getOrganizationTree();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Canonical organization hierarchy retrieved successfully!",
    data: result,
  });
});

const getCanonicalOrganizationByUpazila = catchAsync(
  async (req: Request, res: Response) => {
    const result = await OrganizationService.getCanonicalOrganizationByUpazila(
      req.params.upazilaId,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Canonical Upazila organization retrieved successfully!",
      data: result,
    });
  },
);

const getAffiliatedDonors = catchAsync(async (req: Request, res: Response) => {
  const result = await OrganizationService.getAffiliatedDonors(
    req.params.organizationId,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Affiliated donors retrieved successfully!",
    data: result,
  });
});

export const OrganizationController = {
  getOrganizationTree,
  getCanonicalOrganizationByUpazila,
  getAffiliatedDonors,
  createOrganization,
  registerOrganization,
  getAllOrganizations,
  getOrganizationBySlug,
  getSingleOrganization,
  updateOrganization,
  updateOrganizationVerification,
  deleteOrganization,
};
