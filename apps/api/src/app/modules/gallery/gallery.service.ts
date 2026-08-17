import httpStatus from "http-status";
import { ApprovalStatus, Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";
import { isUuid, toSlug } from "../../shared/slugHelper";
import { IJWTPayload } from "../../types";
import { getActiveActorDonor } from "../../shared/actorDonor";

type CreateGalleryPayload = {
  title: string;
  description?: string;
  category?: string;
  slug?: string;
  coverImage?: string;
  images: string[];
  isPublished?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  // Omitted/undefined -> Homepage Gallery item (admin-only, org-independent).
  organizationId?: string;
};

const createGallery = async (user: IJWTPayload, payload: CreateGalleryPayload) => {
  const creator = await getActiveActorDonor(user);
  if (payload.organizationId) {
    const org = await prisma.organization.findFirst({
      where: {
        id: payload.organizationId,
        isDeleted: false,
      },
    });

    if (!org) {
      throw new ApiError(httpStatus.NOT_FOUND, "Organization not found!");
    }
  }

  const slug = payload.slug ? toSlug(payload.slug) : toSlug(payload.title);
  const existingSlug = await prisma.gallery.findFirst({
    where: { slug, isDeleted: false },
    select: { id: true },
  });

  if (existingSlug) {
    throw new ApiError(httpStatus.CONFLICT, "Gallery slug already exists!");
  }

  return prisma.gallery.create({
    data: {
      title: payload.title,
      description: payload.description,
      category: payload.category,
      slug,
      coverImage: payload.coverImage ?? payload.images[0],
      images: payload.images,
      isFeatured: payload.isFeatured ?? false,
      sortOrder: payload.sortOrder ?? 0,
      createdById: creator.id,
      approvalStatus: user.role === "ADMIN" ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
      isPublished: user.role === "ADMIN" ? (payload.isPublished ?? true) : false,
      reviewedById: user.role === "ADMIN" ? creator.id : null,
      reviewedAt: user.role === "ADMIN" ? new Date() : null,
      organizationId: payload.organizationId ?? null,
    },

    include: {
      organization: true,
    },
  });
};

const getAllGalleries = async (
  params: IGenericFilters,
  options: IOptions,
  management = false,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const filters = params as Record<string, string | undefined>;

  // scope=homepage -> Homepage Gallery items only (organizationId IS NULL).
  // organizationId=<id> -> that Organization's items only.
  // Neither provided -> unscoped (kept for any internal/admin use that
  // genuinely needs the full list; public-facing callers must always pass
  // one of the two above).
  const whereConditions: Prisma.GalleryWhereInput = {
    isDeleted: false,
    ...(management ? {} : { isPublished: true, approvalStatus: ApprovalStatus.APPROVED }),
    ...(filters.scope === "homepage"
      ? { organizationId: null }
      : filters.organizationId
        ? { organizationId: filters.organizationId }
        : {}),
  };

  const normalizedSortOrder: Prisma.SortOrder =
    sortOrder === "asc" ? "asc" : "desc";
  const orderBy: Prisma.GalleryOrderByWithRelationInput[] =
    sortBy === "sortOrder"
      ? [
          { isFeatured: "desc" },
          { sortOrder: normalizedSortOrder },
          { createdAt: "desc" },
        ]
      : [{ [sortBy]: normalizedSortOrder }];

  const [result, total] = await Promise.all([
    prisma.gallery.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy,
      include: { organization: true },
    }),
    prisma.gallery.count({ where: whereConditions }),
  ]);

  return { meta: { page, limit, total }, data: result };
};

const getSingleGallery = async (slugOrId: string, management = false) => {
  if (isUuid(slugOrId)) {
    return prisma.gallery.findUniqueOrThrow({
      where: {
        id: slugOrId,
        isDeleted: false,
        ...(management
          ? {}
          : {
              isPublished: true,
              approvalStatus: ApprovalStatus.APPROVED,
            }),
      },
      include: { organization: true },
    });
  }

  const bySlug = await prisma.gallery.findFirst({
    where: {
      slug: slugOrId,
      isDeleted: false,
      ...(management ? {} : { isPublished: true, approvalStatus: ApprovalStatus.APPROVED }),
    },
    include: { organization: true },
  });
  if (bySlug) return bySlug;

  const galleries = await prisma.gallery.findMany({
    where: {
      isDeleted: false,
      ...(management ? {} : { isPublished: true, approvalStatus: ApprovalStatus.APPROVED }),
    },
    select: { id: true, title: true },
  });
  const match = galleries.find((g) => toSlug(g.title) === slugOrId);
  if (!match) throw new ApiError(httpStatus.NOT_FOUND, "Gallery not found!");

  return prisma.gallery.findUniqueOrThrow({
    where: {
      id: match.id,
      isDeleted: false,
      ...(management ? {} : { isPublished: true, approvalStatus: ApprovalStatus.APPROVED }),
    },
    include: { organization: true },
  });
};

const getGalleryBySlug = async (slug: string) => {
  const gallery = await prisma.gallery.findFirst({
    where: { slug, isDeleted: false, isPublished: true, approvalStatus: ApprovalStatus.APPROVED },
    include: { organization: true },
  });

  if (!gallery) {
    throw new ApiError(httpStatus.NOT_FOUND, "Gallery not found!");
  }

  return gallery;
};

const updateGallery = async (
  user: IJWTPayload,
  id: string,
  payload: Prisma.GalleryUpdateInput,
) => {
  const existing = await prisma.gallery.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Gallery not found!");

  const nextPayload: Prisma.GalleryUpdateInput = {
    ...payload,
    ...(user.role === "ADMIN"
      ? {}
      : {
          isPublished: false,
          approvalStatus: ApprovalStatus.PENDING,
          reviewedBy: { disconnect: true },
          reviewedAt: null,
        }),
  };

  if (typeof nextPayload.slug === "string") {
    nextPayload.slug = toSlug(nextPayload.slug);
    const existingSlug = await prisma.gallery.findFirst({
      where: {
        slug: nextPayload.slug,
        isDeleted: false,
        NOT: { id },
      },
      select: { id: true },
    });

    if (existingSlug) {
      throw new ApiError(httpStatus.CONFLICT, "Gallery slug already exists!");
    }
  }

  return prisma.gallery.update({ where: { id }, data: nextPayload });
};

const updateGalleryApproval = async (
  user: IJWTPayload,
  id: string,
  approvalStatus: ApprovalStatus,
) => {
  const reviewer = await getActiveActorDonor(user);
  const existing = await prisma.gallery.findUnique({ where: { id, isDeleted: false } });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Gallery not found!");
  return prisma.gallery.update({
    where: { id },
    data: {
      approvalStatus,
      isPublished: approvalStatus === ApprovalStatus.APPROVED,
      reviewedById: reviewer.id,
      reviewedAt: new Date(),
    },
  });
};

const deleteGallery = async (id: string) => {
  const existing = await prisma.gallery.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Gallery not found!");

  return prisma.gallery.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

export const GalleryService = {
  createGallery,
  getAllGalleries,
  getSingleGallery,
  getGalleryBySlug,
  updateGallery,
  updateGalleryApproval,
  deleteGallery,
};
