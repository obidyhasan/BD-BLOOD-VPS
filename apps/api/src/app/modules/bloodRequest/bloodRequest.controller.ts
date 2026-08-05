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
  const idempotencyKey = String(req.header("Idempotency-Key") ?? "");
  const result = await BloodRequestService.createRequest(req.body, idempotencyKey);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Blood request created successfully!",
    data: result,
  });
});

const trackRequest = catchAsync(async (req: Request, res: Response) => {
  const result = await BloodRequestService.trackRequest(
    req.params.referenceCode,
    String(req.query.phoneSuffix ?? ""),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blood request tracking retrieved successfully!",
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

const withdrawAssignment = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BloodRequestCommandService.withdrawAssignment(
      req.user as IJWTPayload,
      req.params.assignmentId,
      req.body.reason,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Assignment commitment withdrawn successfully!",
      data: result,
    });
  },
);

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
  trackRequest,
  getAllRequests,
  getSingleRequest,
  sendRequesterSms,
  getEligibleDonors,
  assignDonors,
  getAssignmentForDonor,
  acceptAssignment,
  rejectAssignment,
  withdrawAssignment,
  getRequestNotifications,
  startProcessing,
  rejectRequest,
  cancelRequestCommand,
  completeHandover,
};
