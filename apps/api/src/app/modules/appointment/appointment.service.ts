import httpStatus from "http-status";
import { randomUUID } from "crypto";
import {
  AccountStatus,
  AppointmentStatus,
  NotificationPriority,
  NotificationType,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper } from "../../helper/paginationHelper";
import { IJWTPayload } from "../../types";
import { emitDonorNotification } from "../../shared/socket";
import { assertCanAccessOrganizationDashboard } from "../../middlewares/orgAccess";

const getDonorFromUser = async (user: IJWTPayload) => {
  const donor = await prisma.donor.findUnique({
    where: { email: user.email, isDeleted: false },
  });
  if (!donor) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  if (donor.accountStatus !== AccountStatus.ACTIVE) {
    throw new ApiError(httpStatus.FORBIDDEN, `User is ${donor.accountStatus}`);
  }
  return donor;
};

const createAppointment = async (user: IJWTPayload, payload: any) => {
  const donor = await getDonorFromUser(user);

  const organization = await prisma.organization.findUnique({
    where: { id: payload.organizationId, isDeleted: false },
  });
  if (!organization) {
    throw new ApiError(httpStatus.NOT_FOUND, "Organization not found!");
  }

  if (payload.eventId) {
    const event = await prisma.event.findUnique({
      where: { id: payload.eventId, isDeleted: false },
    });
    if (!event) throw new ApiError(httpStatus.NOT_FOUND, "Event not found!");
    if (event.organizationId !== organization.id) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Event does not belong to this organization.",
      );
    }
  }

  const scheduledAt =
    payload.scheduledAt instanceof Date
      ? payload.scheduledAt
      : new Date(payload.scheduledAt);

  if (Number.isNaN(scheduledAt.getTime())) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid scheduled date.");
  }

  if (scheduledAt <= new Date()) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Appointment must be scheduled in the future.",
    );
  }

  const bloodGroupId = payload.bloodGroupId ?? donor.bloodGroupId;

  const appointment = await prisma.donationAppointment.create({
    data: {
      donorId: donor.id,
      organizationId: organization.id,
      eventId: payload.eventId,
      bloodGroupId,
      scheduledAt,
      notes: payload.notes,
      status: AppointmentStatus.PENDING,
    },
    include: {
      organization: true,
      event: true,
      bloodGroup: true,
    },
  });

  const orgMembers = await prisma.organizationMember.findMany({
    where: {
      organizationId: organization.id,
      status: "ACTIVE",
      isDeleted: false,
    },
    select: { donorId: true },
  });

  if (orgMembers.length) {
    const now = new Date();
    const notifications = orgMembers.map((member) => ({
      id: randomUUID(),
      donorId: member.donorId,
      title: "New Donation Appointment",
      message: `${donor.fullName} booked an appointment on ${scheduledAt.toLocaleDateString()}.`,
      type: NotificationType.ORG,
      priority: NotificationPriority.MEDIUM,
      relatedId: appointment.id,
      relatedType: "APPOINTMENT",
      isRead: false,
      createdAt: now,
      updatedAt: now,
    }));

    // Single batched insert instead of one create() per org member.
    await prisma.notification.createMany({ data: notifications });

    for (const notification of notifications) {
      emitDonorNotification(notification.donorId, notification);
    }
  }

  return appointment;
};

const getMyAppointments = async (user: IJWTPayload, options: any) => {
  const donor = await getDonorFromUser(user);
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const where: Prisma.DonationAppointmentWhereInput = {
    donorId: donor.id,
    isDeleted: false,
  };

  const [data, total] = await Promise.all([
    prisma.donationAppointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        organization: true,
        event: true,
        bloodGroup: true,
      },
    }),
    prisma.donationAppointment.count({ where }),
  ]);

  return { meta: { page, limit, total }, data };
};

const getOrganizationAppointments = async (
  user: IJWTPayload,
  organizationId: string,
  options: any,
) => {
  await assertCanAccessOrganizationDashboard(user, organizationId);

  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const where: Prisma.DonationAppointmentWhereInput = {
    organizationId,
    isDeleted: false,
  };

  const [data, total] = await Promise.all([
    prisma.donationAppointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        donor: { omit: { password: true }, include: { bloodGroup: true } },
        event: true,
        bloodGroup: true,
      },
    }),
    prisma.donationAppointment.count({ where }),
  ]);

  return { meta: { page, limit, total }, data };
};

const getSingleAppointment = async (user: IJWTPayload, id: string) => {
  const appointment = await prisma.donationAppointment.findUnique({
    where: { id, isDeleted: false },
    include: {
      donor: { omit: { password: true }, include: { bloodGroup: true } },
      organization: true,
      event: true,
      bloodGroup: true,
    },
  });

  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Appointment not found!");
  }

  const donor = await getDonorFromUser(user);
  const isOwner = appointment.donorId === donor.id;

  if (!isOwner && user.role !== "ADMIN") {
    await assertCanAccessOrganizationDashboard(user, appointment.organizationId);
  } else if (!isOwner && user.role === "ADMIN") {
    // admin ok
  } else if (!isOwner) {
    throw new ApiError(httpStatus.FORBIDDEN, "Access denied.");
  }

  return appointment;
};

const updateAppointmentStatus = async (
  user: IJWTPayload,
  id: string,
  status: AppointmentStatus,
  notes?: string,
) => {
  const appointment = await prisma.donationAppointment.findUnique({
    where: { id, isDeleted: false },
  });
  if (!appointment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Appointment not found!");
  }

  const donor = await getDonorFromUser(user);
  const isOwner = appointment.donorId === donor.id;

  if (isOwner && status === AppointmentStatus.CANCELLED) {
    // donor can cancel own appointment
  } else if (user.role === "ADMIN") {
    // admin can update any
  } else {
    await assertCanAccessOrganizationDashboard(user, appointment.organizationId);
  }

  const updated = await prisma.donationAppointment.update({
    where: { id },
    data: {
      status,
      ...(notes !== undefined ? { notes } : {}),
    },
    include: {
      organization: true,
      event: true,
      bloodGroup: true,
      donor: { omit: { password: true } },
    },
  });

  const notification = await prisma.notification.create({
    data: {
      donorId: appointment.donorId,
      title: "Appointment Updated",
      message: `Your donation appointment is now ${status.toLowerCase().replace("_", " ")}.`,
      type: NotificationType.EVENT,
      priority: NotificationPriority.MEDIUM,
      relatedId: appointment.id,
      relatedType: "APPOINTMENT",
    },
  });
  emitDonorNotification(appointment.donorId, notification);

  return updated;
};

const cancelAppointment = async (user: IJWTPayload, id: string) => {
  return updateAppointmentStatus(user, id, AppointmentStatus.CANCELLED);
};

export const AppointmentService = {
  createAppointment,
  getMyAppointments,
  getOrganizationAppointments,
  getSingleAppointment,
  updateAppointmentStatus,
  cancelAppointment,
};
