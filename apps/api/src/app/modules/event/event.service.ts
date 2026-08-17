import httpStatus from "http-status";
import { ApprovalStatus, Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";
import { IJWTPayload } from "../../types";
import { eventSearchableFields } from "./event.constant";
import { isUuid, toSlug } from "../../shared/slugHelper";
import { assertCanAccessOrganizationDashboard } from "../../middlewares/orgAccess";
import { assertGeographicHierarchy } from "../../shared/geographicHierarchy";
import { getActiveActorDonor } from "../../shared/actorDonor";

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

const createEvent = async (user: IJWTPayload, payload: any) => {
  const creator = await getActiveActorDonor(user);
  if (user.role !== "ADMIN") {
    await assertCanAccessOrganizationDashboard(user, payload.organizationId);
  }
  const org = await prisma.organization.findUnique({
    where: { id: payload.organizationId, isDeleted: false },
  });
  if (!org) throw new ApiError(httpStatus.NOT_FOUND, "Organization not found!");
  await assertGeographicHierarchy(prisma, payload.divisionId, payload.districtId, payload.upazilaId);
  if (
    org.divisionId !== payload.divisionId ||
    org.districtId !== payload.districtId ||
    (org.level === "UPAZILA" && org.upazilaId !== payload.upazilaId)
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Event location must belong to the selected organization scope.");
  }

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
      createdById: creator.id,
      approvalStatus: user.role === "ADMIN" ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
      reviewedById: user.role === "ADMIN" ? creator.id : null,
      reviewedAt: user.role === "ADMIN" ? new Date() : null,
    },
    include: {
      organization: true,
      division: true,
      district: true,
      upazila: true,
    },
  });
};

const getAllEvents = async (params: IGenericFilters, options: IOptions, management = false) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params as Record<string, string | undefined>;

  const andConditions: Prisma.EventWhereInput[] = [{
    isDeleted: false,
    ...(management ? {} : { approvalStatus: ApprovalStatus.APPROVED }),
  }];

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
    where: { slug: slugOrId, isDeleted: false, approvalStatus: ApprovalStatus.APPROVED },
    select: { id: true },
  });
  if (bySlug) return bySlug.id;

  const events = await prisma.event.findMany({
    where: { isDeleted: false, approvalStatus: ApprovalStatus.APPROVED },
    select: { id: true, title: true },
  });
  const match = events.find((e) => toSlug(e.title) === slugOrId);
  if (!match) throw new ApiError(httpStatus.NOT_FOUND, "Event not found!");
  return match.id;
};

const getSingleEvent = async (slugOrId: string) => {
  const id = await resolveEventId(slugOrId);

  return prisma.event.findUniqueOrThrow({
    where: { id, isDeleted: false, approvalStatus: ApprovalStatus.APPROVED },
    include: {
      organization: true,
      division: true,
      district: true,
      upazila: true,
      participants: {
        include: {
          donor: {
            select: {
              id: true,
              slug: true,
              fullName: true,
              profilePhoto: true,
              bloodGroup: { select: { groupName: true } },
            },
          },
        },
      },
    },
  });
};

const getEventBySlug = async (slug: string) => {
  const event = await prisma.event.findFirst({
    where: { slug, isDeleted: false, approvalStatus: ApprovalStatus.APPROVED },
    include: {
      organization: true,
      division: true,
      district: true,
      upazila: true,
      participants: {
        include: {
          donor: {
            select: {
              id: true,
              slug: true,
              fullName: true,
              profilePhoto: true,
              bloodGroup: { select: { groupName: true } },
            },
          },
        },
      },
    },
  });

  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "Event not found!");
  }

  return event;
};

const updateEvent = async (user: IJWTPayload, id: string, payload: Prisma.EventUncheckedUpdateInput) => {
  const existing = await prisma.event.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Event not found!");
  if (user.role !== "ADMIN") {
    await assertCanAccessOrganizationDashboard(user, existing.organizationId);
  }

  const divisionId = typeof payload.divisionId === "string" ? payload.divisionId : existing.divisionId;
  const districtId = typeof payload.districtId === "string" ? payload.districtId : existing.districtId;
  const upazilaId = typeof payload.upazilaId === "string" ? payload.upazilaId : existing.upazilaId;
  await assertGeographicHierarchy(prisma, divisionId, districtId, upazilaId);

  return prisma.event.update({
    where: { id },
    data: {
      ...payload,
      ...(user.role === "ADMIN" ? {} : {
        approvalStatus: ApprovalStatus.PENDING,
        reviewedById: null,
        reviewedAt: null,
      }),
    },
  });
};

const deleteEvent = async (user: IJWTPayload, id: string) => {
  const existing = await prisma.event.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Event not found!");
  if (user.role !== "ADMIN") {
    await assertCanAccessOrganizationDashboard(user, existing.organizationId);
  }

  return prisma.event.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

const updateEventApproval = async (user: IJWTPayload, id: string, approvalStatus: ApprovalStatus) => {
  const reviewer = await getActiveActorDonor(user);
  const existing = await prisma.event.findUnique({ where: { id, isDeleted: false } });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Event not found!");
  return prisma.event.update({
    where: { id },
    data: { approvalStatus, reviewedById: reviewer.id, reviewedAt: new Date() },
  });
};

const joinEvent = async (
  user: IJWTPayload,
  eventId: string,
  participationType: any,
) => {
  const donor = await getActiveActorDonor(user);
  const event = await prisma.event.findUnique({
    where: { id: eventId, isDeleted: false, approvalStatus: ApprovalStatus.APPROVED },
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
  const donor = await getActiveActorDonor(user);

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
  updateEventApproval,
  joinEvent,
  leaveEvent,
  getEventParticipants,
};
