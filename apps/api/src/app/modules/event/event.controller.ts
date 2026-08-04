import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { IJWTPayload } from "../../types";
import { EventService } from "./event.service";
import { eventFilterableFields } from "./event.constant";

const createEvent = catchAsync(async (req: Request, res: Response) => {
  const result = await EventService.createEvent(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Event created successfully!",
    data: result,
  });
});

const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, eventFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await EventService.getAllEvents(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Events retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getEventBySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await EventService.getEventBySlug(req.params.slug);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Event retrieved successfully!",
    data: result,
  });
});

const getSingleEvent = catchAsync(async (req: Request, res: Response) => {
  const result = await EventService.getSingleEvent(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Event retrieved successfully!",
    data: result,
  });
});

const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const result = await EventService.updateEvent(req.params.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Event updated successfully!",
    data: result,
  });
});

const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const result = await EventService.deleteEvent(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Event deleted successfully!",
    data: result,
  });
});

const joinEvent = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await EventService.joinEvent(
      req.user as IJWTPayload,
      req.params.id,
      req.body.participationType,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Event participation updated successfully!",
      data: result,
    });
  },
);

const leaveEvent = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await EventService.leaveEvent(
      req.user as IJWTPayload,
      req.params.id,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Left event successfully!",
      data: result,
    });
  },
);

const getEventParticipants = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, ["page", "limit"]);
  const result = await EventService.getEventParticipants(
    req.params.id,
    options,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Event participants retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

export const EventController = {
  createEvent,
  getAllEvents,
  getEventBySlug,
  getSingleEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  getEventParticipants,
};
