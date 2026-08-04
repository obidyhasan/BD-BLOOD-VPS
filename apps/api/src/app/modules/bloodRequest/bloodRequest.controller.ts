import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { BloodRequestService } from "./bloodRequest.service";
import { BloodRequestCommandService } from "./bloodRequest.command.service";
import { bloodRequestFilterableFields } from "./bloodRequest.constant";
import { IJWTPayload } from "../../types";

const createRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await BloodRequestService.createRequest(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Blood request created successfully!",
    data: result,
  });
});

const getAllRequests = catchAsync(async (
  req: Request & { user?: IJWTPayload },
  res: Response,
) => {
  const filters = pick(req.query, bloodRequestFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await BloodRequestService.getAllRequests(
    req.user as IJWTPayload,
    filters,
    options,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood requests retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getSingleRequest = catchAsync(async (
  req: Request & { user?: IJWTPayload },
  res: Response,
) => {
  const result = await BloodRequestService.getSingleRequest(
    req.user as IJWTPayload,
    req.params.id,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood request retrieved successfully!",
    data: result,
  });
});

const updateRequestStatus = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user as IJWTPayload;
    const status = req.body.status as string;
    const result =
      status === "PROCESSING"
        ? await BloodRequestCommandService.startProcessing(user, req.params.id)
        : status === "REJECTED"
          ? await BloodRequestCommandService.rejectRequest(
              user,
              req.params.id,
              req.body.reason ?? "Rejected through legacy status adapter",
            )
          : status === "CANCELLED"
            ? await BloodRequestCommandService.cancelRequest(
                user,
                req.params.id,
                req.body.reason ?? "Cancelled through legacy status adapter",
              )
            : status === "COMPLETED"
              ? await BloodRequestCommandService.completeHandover(
                  user,
                  req.params.id,
                )
              : (() => {
                  throw Object.assign(
                    new Error(
                      "This status is derived by donor commitments or verified donations and cannot be set manually.",
                    ),
                    {
                      statusCode: httpStatus.CONFLICT,
                      errorCode: "INVALID_REQUEST_TRANSITION",
                    },
                  );
                })();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blood request status updated successfully!",
      data: result,
    });
  },
);

const cancelRequest = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BloodRequestCommandService.cancelRequest(
      req.user as IJWTPayload,
      req.params.id,
      req.body?.reason ?? "Cancelled through legacy command adapter",
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blood request cancelled successfully!",
      data: result,
    });
  },
);

const deleteRequest = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BloodRequestService.deleteRequest(
      req.user as IJWTPayload,
      req.params.id,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blood request cancelled successfully!",
      data: result,
    });
  },
);

const getEligibleDonors = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BloodRequestService.getEligibleDonors(
      req.user as IJWTPayload,
      req.params.id,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Eligible donors retrieved successfully!",
      data: result,
    });
  },
);

const assignDonors = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BloodRequestService.assignDonors(
      req.user as IJWTPayload,
      req.params.id,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Eligible donors notified successfully!",
      data: result,
    });
  },
);

const getAssignmentForDonor = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BloodRequestService.getAssignmentForDonor(
      req.user as IJWTPayload,
      req.params.assignmentId,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Assignment retrieved successfully!",
      data: result,
    });
  },
);

const acceptAssignment = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BloodRequestCommandService.respondToAssignment(
      req.user as IJWTPayload,
      req.params.assignmentId,
      "ACCEPT",
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Assignment accepted successfully!",
      data: result,
    });
  },
);

const rejectAssignment = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BloodRequestCommandService.respondToAssignment(
      req.user as IJWTPayload,
      req.params.assignmentId,
      "DECLINE",
      req.body.rejectionReason,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Assignment rejected successfully!",
      data: result,
    });
  },
);

const rematchOrganizations = catchAsync(async (req: Request, res: Response) => {
  const result = await BloodRequestService.rematchOrganizations(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Request rematched successfully!",
    data: result,
  });
});

const sendRequesterSms = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BloodRequestService.sendRequesterSms(
      req.user as IJWTPayload,
      req.params.id,
      req.body.message,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "SMS sent to requester successfully!",
      data: result,
    });
  },
);

const getRequestNotifications = catchAsync(
  async (req: Request, res: Response) => {
    const result = await BloodRequestService.getRequestNotifications(
      req.params.id,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Request notifications retrieved successfully!",
      data: result,
    });
  },
);

const startProcessing = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BloodRequestCommandService.startProcessing(
      req.user as IJWTPayload,
      req.params.id,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blood request processing started.",
      data: result,
    });
  },
);

const rejectRequest = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BloodRequestCommandService.rejectRequest(
      req.user as IJWTPayload,
      req.params.id,
      req.body.reason,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blood request rejected.",
      data: result,
    });
  },
);

const cancelRequestCommand = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BloodRequestCommandService.cancelRequest(
      req.user as IJWTPayload,
      req.params.id,
      req.body.reason,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blood request cancelled.",
      data: result,
    });
  },
);

const completeHandover = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BloodRequestCommandService.completeHandover(
      req.user as IJWTPayload,
      req.params.id,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blood hand-over completed.",
      data: result,
    });
  },
);

export const BloodRequestController = {
  createRequest,
  getAllRequests,
  getSingleRequest,
  updateRequestStatus,
  cancelRequest,
  sendRequesterSms,
  deleteRequest,
  getEligibleDonors,
  assignDonors,
  getAssignmentForDonor,
  acceptAssignment,
  rejectAssignment,
  rematchOrganizations,
  getRequestNotifications,
  startProcessing,
  rejectRequest,
  cancelRequestCommand,
  completeHandover,
};
