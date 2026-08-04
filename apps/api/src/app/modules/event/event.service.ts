import httpStatus from "http-status";
import { AccountStatus, Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";
import { IJWTPayload } from "../../types";
import { eventSearchableFields } from "./event.constant";
import { isUuid, toSlug } from "../../shared/slugHelper";

const getRequesterDonor = async (user: IJWTPayload) => {
  const donor = await prisma.donor.findUnique({ where: { email: user.email } });
  if (!donor) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  if (donor.isDeleted)
    throw new ApiError(httpStatus.BAD_REQUEST, "User is deleted!");
  if (donor.accountStatus !== AccountStatus.ACTIVE) {
    throw new ApiError(httpStatus.FORBIDDEN, `User is ${donor.accountStatus}`);
  }
  return donor;
};

const uniqueEventSlug = async (title: string, excludeId?: string) => {
  let base = toSlug(title) || "event";
  let slug = base;
  let n = 1;
  while (
    await prisma.event.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    })
  ) {
    slug = `${base}-${n++}`;
  }
  return slug;
};

const createEvent = async (payload: any) => {
  const org = await prisma.organization.findUnique({
    where: { id: payload.organizationId, isDeleted: false },
  });
  if (!org) throw new ApiError(httpStatus.NOT_FOUND, "Organization not found!");

  const eventDate =
    payload.eventDate instanceof Date
      ? payload.eventDate
      : new Date(payload.eventDate);
  if (Number.isNaN(eventDate.getTime())) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid event date!");
  }

  const slug = payload.slug || (await uniqueEventSlug(payload.title));

  return prisma.event.create({
    data: {
      organizationId: payload.organizationId,
      title: payload.title,
      description: payload.description,
      eventType: payload.eventType,
      eventDate,
      eventTime: payload.eventTime,
      slots: payload.slots,
      divisionId: payload.divisionId,
      districtId: payload.districtId,
      upazilaId: payload.upazilaId,
      locationDetails: payload.locationDetails,
      slug,
    },
    include: {
      organization: true,
      division: true,
      district: true,
      upazila: true,
    },
  });
};

const getAllEvents = async (params: IGenericFilters, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params as Record<string, string | undefined>;

  const andConditions: Prisma.EventWhereInput[] = [{ isDeleted: false }];

  if (searchTerm) {
    andConditions.push({
      OR: eventSearchableFields.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: { equals: filterData[key] },
      })),
    });
  }

  const whereConditions: Prisma.EventWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [result, total] = await Promise.all([
    prisma.event.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { [sortBy]: sortOrder },
      include: {
        organization: true,
        division: true,
        district: true,
        upazila: true,
      },
    }),
    prisma.event.count({ where: whereConditions }),
  ]);

  return { meta: { page, limit, total }, data: result };
};

const resolveEventId = async (slugOrId: string) => {
  if (isUuid(slugOrId)) return slugOrId;

  const bySlug = await prisma.event.findFirst({
    where: { slug: slugOrId, isDeleted: false },
    select: { id: true },
  });
  if (bySlug) return bySlug.id;

  const events = await prisma.event.findMany({
    where: { isDeleted: false },
    select: { id: true, title: true },
  });
  const match = events.find((e) => toSlug(e.title) === slugOrId);
  if (!match) throw new ApiError(httpStatus.NOT_FOUND, "Event not found!");
  return match.id;
};

const getSingleEvent = async (slugOrId: string) => {
  const id = await resolveEventId(slugOrId);

  return prisma.event.findUniqueOrThrow({
    where: { id, isDeleted: false },
    include: {
      organization: true,
      division: true,
      district: true,
      upazila: true,
      participants: {
        include: {
          donor: { omit: { password: true }, include: { bloodGroup: true } },
        },
      },
    },
  });
};

const getEventBySlug = async (slug: string) => {
  const event = await prisma.event.findFirst({
    where: { slug, isDeleted: false },
    include: {
      organization: true,
      division: true,
      district: true,
      upazila: true,
      participants: {
        include: {
          donor: { omit: { password: true }, include: { bloodGroup: true } },
        },
      },
    },
  });

  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "Event not found!");
  }

  return event;
};

const updateEvent = async (id: string, payload: Prisma.EventUpdateInput) => {
  const existing = await prisma.event.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Event not found!");

  return prisma.event.update({
    where: { id },
    data: payload,
  });
};

const deleteEvent = async (id: string) => {
  const existing = await prisma.event.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Event not found!");

  return prisma.event.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

const joinEvent = async (
  user: IJWTPayload,
  eventId: string,
  participationType: any,
) => {
  const donor = await getRequesterDonor(user);
  const event = await prisma.event.findUnique({
    where: { id: eventId, isDeleted: false },
  });
  if (!event) throw new ApiError(httpStatus.NOT_FOUND, "Event not found!");

  return prisma.eventParticipant.upsert({
    where: {
      eventId_donorId: {
        eventId,
        donorId: donor.id,
      },
    },
    create: {
      eventId,
      donorId: donor.id,
      participationType,
    },
    update: {
      participationType,
    },
    include: {
      event: true,
    },
  });
};

const leaveEvent = async (user: IJWTPayload, eventId: string) => {
  const donor = await getRequesterDonor(user);

  const existing = await prisma.eventParticipant.findUnique({
    where: {
      eventId_donorId: { eventId, donorId: donor.id },
      isDeleted: false,
    },
  });

  if (!existing) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "You are not participating in this event!",
    );
  }

  return prisma.eventParticipant.delete({
    where: { id: existing.id },
  });
};

const getEventParticipants = async (eventId: string, options: IOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const existingEvent = await prisma.event.findUnique({
    where: { id: eventId, isDeleted: false },
  });
  if (!existingEvent) {
    throw new ApiError(httpStatus.NOT_FOUND, "Event not found!");
  }

  const [result, total] = await Promise.all([
    prisma.eventParticipant.findMany({
      where: { eventId, isDeleted: false },
      skip,
      take: limit,
      include: {
        donor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            bloodGroup: { select: { groupName: true } },
            profilePhoto: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.eventParticipant.count({
      where: { eventId, isDeleted: false },
    }),
  ]);

  return { meta: { page, limit, total }, data: result };
};

export const EventService = {
  createEvent,
  getAllEvents,
  getSingleEvent,
  getEventBySlug,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  getEventParticipants,
};
