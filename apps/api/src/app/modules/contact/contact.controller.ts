import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { ContactService } from "./contact.service";
import { ContactMessageStatus } from "@prisma/client";

const createContactMessage = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactService.createContactMessage(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Message received. We will respond shortly.",
    data: { id: result.id },
  });
});

const getRecentContactMessages = catchAsync(
  async (req: Request, res: Response) => {
    const limit = Number(req.query.limit) || 20;
    const result = await ContactService.getRecentContactMessages(limit);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Contact messages retrieved!",
      data: result,
    });
  },
);

const updateContactMessageStatus = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ContactService.updateContactMessageStatus(
      req.params.id,
      req.body.status as ContactMessageStatus,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Contact message status updated!",
      data: result,
    });
  },
);

export const ContactController = {
  createContactMessage,
  getRecentContactMessages,
  updateContactMessageStatus,
};
