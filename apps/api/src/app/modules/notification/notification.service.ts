import httpStatus from "http-status";
import { randomUUID } from "crypto";
import {
  AccountStatus,
  NotificationPriority,
  NotificationType,
  Prisma,
  Role,
} from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";
import { IJWTPayload } from "../../types";
import { emitDonorNotification } from "../../shared/socket";

const getRequesterDonor = async (user: IJWTPayload) => {
  const donor = await prisma.donor.findUnique({ where: { email: user.email } });
  if (!donor) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  if (donor.isDeleted) throw new ApiError(httpStatus.BAD_REQUEST, "User is deleted!");
  if (donor.accountStatus !== AccountStatus.ACTIVE) {
    throw new ApiError(httpStatus.FORBIDDEN, `User is ${donor.accountStatus}`);
  }
  return donor;
};

const createNotification = async (payload: {
  donorId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
}) => {
  const donor = await prisma.donor.findUnique({ where: { id: payload.donorId, isDeleted: false } });
  if (!donor) throw new ApiError(httpStatus.NOT_FOUND, "Donor not found!");

  const notification = await prisma.notification.create({
    data: {
      donorId: payload.donorId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      priority: payload.priority ?? NotificationPriority.ROUTINE,
    },
  });

  emitDonorNotification(payload.donorId, notification);
  return notification;
};

const broadcastNotification = async (
  payload: {
    title: string;
    message: string;
    type: NotificationType;
    priority?: NotificationPriority;
  },
) => {
  const donors = await prisma.donor.findMany({
    where: {
      isDeleted: false,
      accountStatus: AccountStatus.ACTIVE,
      role: Role.DONOR,
    },
    select: { id: true },
  });

  if (!donors.length) {
    return { count: 0, notifications: [] };
  }

  // Generate ids client-side so we can batch the insert into a single
  // createMany (one round trip regardless of donor count) instead of N
  // sequential `create` calls inside a transaction, while still having
  // each notification's id/content available locally for the socket
  // fan-out below.
  const now = new Date();
  const notifications = donors.map((donor) => ({
    id: randomUUID(),
    donorId: donor.id,
    title: payload.title,
    message: payload.message,
    type: payload.type,
    priority: payload.priority ?? NotificationPriority.ROUTINE,
    relatedId: null as string | null,
    relatedType: null as string | null,
    isRead: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null as Date | null,
    isDeleted: false,
  }));

  await prisma.notification.createMany({ data: notifications });

  for (const notification of notifications) {
    emitDonorNotification(notification.donorId, notification);
  }

  return { count: notifications.length, notifications };
};

const getMyNotifications = async (user: IJWTPayload, params: IGenericFilters, options: IOptions) => {
  const donor = await getRequesterDonor(user);
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  // Query-string values are always strings/undefined in practice — see
  // IGenericFilters' doc comment.
  const filters = params as Record<string, string | undefined>;

  const whereConditions: Prisma.NotificationWhereInput = {
    isDeleted: false,
    donorId: donor.id,
    ...(filters.isRead !== undefined ? { isRead: filters.isRead === "true" } : {}),
    ...(filters.type ? { type: filters.type as NotificationType } : {}),
  };

  const [result, total] = await Promise.all([
    prisma.notification.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.notification.count({ where: whereConditions }),
  ]);

  return { meta: { page, limit, total }, data: result };
};

const markNotificationRead = async (user: IJWTPayload, id: string, isRead: boolean) => {
  const donor = await getRequesterDonor(user);
  const existing = await prisma.notification.findUnique({
    where: { id, donorId: donor.id, isDeleted: false },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Notification not found!");

  return prisma.notification.update({
    where: { id },
    data: { isRead },
  });
};

const markAllRead = async (user: IJWTPayload) => {
  const donor = await getRequesterDonor(user);
  await prisma.notification.updateMany({
    where: { donorId: donor.id, isDeleted: false, isRead: false },
    data: { isRead: true },
  });
  return { message: "All notifications marked as read" };
};

const deleteNotification = async (user: IJWTPayload, id: string) => {
  const donor = await getRequesterDonor(user);
  const existing = await prisma.notification.findUnique({
    where: { id, donorId: donor.id, isDeleted: false },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Notification not found!");

  return prisma.notification.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

export const NotificationService = {
  createNotification,
  broadcastNotification,
  getMyNotifications,
  markNotificationRead,
  markAllRead,
  deleteNotification,
};

