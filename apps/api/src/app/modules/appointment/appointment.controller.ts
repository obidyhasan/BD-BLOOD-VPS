import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { IJWTPayload } from "../../types";
import { AppointmentService } from "./appointment.service";

const createAppointment = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await AppointmentService.createAppointment(
      req.user as IJWTPayload,
      req.body,
    );
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Appointment booked successfully!",
      data: result,
    });
  },
);

const getMyAppointments = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await AppointmentService.getMyAppointments(
      req.user as IJWTPayload,
      req.query,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Appointments retrieved successfully!",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getOrganizationAppointments = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await AppointmentService.getOrganizationAppointments(
      req.user as IJWTPayload,
      req.params.organizationId,
      req.query,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Organization appointments retrieved successfully!",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getSingleAppointment = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await AppointmentService.getSingleAppointment(
      req.user as IJWTPayload,
      req.params.id,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Appointment retrieved successfully!",
      data: result,
    });
  },
);

const updateAppointmentStatus = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await AppointmentService.updateAppointmentStatus(
      req.user as IJWTPayload,
      req.params.id,
      req.body.status,
      req.body.notes,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Appointment status updated!",
      data: result,
    });
  },
);

const cancelAppointment = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await AppointmentService.cancelAppointment(
      req.user as IJWTPayload,
      req.params.id,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Appointment cancelled!",
      data: result,
    });
  },
);

export const AppointmentController = {
  createAppointment,
  getMyAppointments,
  getOrganizationAppointments,
  getSingleAppointment,
  updateAppointmentStatus,
  cancelAppointment,
};
