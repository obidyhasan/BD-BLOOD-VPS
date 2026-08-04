import httpStatus from "http-status";
import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";
import { isUuid, toSlug } from "../../shared/slugHelper";

type CreateGalleryPayload = {
  title: string;
  description?: string;
  category?: string;
  slug?: string;
  coverImage?: string;
  images: string[];
  // Omitted/undefined -> Homepage Gallery item (admin-only, org-independent).
  organizationId?: string;
};

const createGallery = async (payload: CreateGalleryPayload) => {
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

      ...(payload.organizationId
        ? { organization: { connect: { id: payload.organizationId } } }
        : {}),
    },

    include: {
      organization: true,
    },
  });
};

const getAllGalleries = async (params: IGenericFilters, options: IOptions) => {
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
    ...(filters.scope === "homepage"
      ? { organizationId: null }
      : filters.organizationId
        ? { organizationId: filters.organizationId }
        : {}),
  };

  const [result, total] = await Promise.all([
    prisma.gallery.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { [sortBy]: sortOrder },
      include: { organization: true },
    }),
    prisma.gallery.count({ where: whereConditions }),
  ]);

  return { meta: { page, limit, total }, data: result };
};

const getSingleGallery = async (slugOrId: string) => {
  if (isUuid(slugOrId)) {
    return prisma.gallery.findUniqueOrThrow({
      where: { id: slugOrId, isDeleted: false },
      include: { organization: true },
    });
  }

  const bySlug = await prisma.gallery.findFirst({
    where: { slug: slugOrId, isDeleted: false },
    include: { organization: true },
  });
  if (bySlug) return bySlug;

  const galleries = await prisma.gallery.findMany({
    where: { isDeleted: false },
    select: { id: true, title: true },
  });
  const match = galleries.find((g) => toSlug(g.title) === slugOrId);
  if (!match) throw new ApiError(httpStatus.NOT_FOUND, "Gallery not found!");

  return prisma.gallery.findUniqueOrThrow({
    where: { id: match.id, isDeleted: false },
    include: { organization: true },
  });
};

const getGalleryBySlug = async (slug: string) => {
  const gallery = await prisma.gallery.findFirst({
    where: { slug, isDeleted: false },
    include: { organization: true },
  });

  if (!gallery) {
    throw new ApiError(httpStatus.NOT_FOUND, "Gallery not found!");
  }

  return gallery;
};

const updateGallery = async (
  id: string,
  payload: Prisma.GalleryUpdateInput,
) => {
  const existing = await prisma.gallery.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Gallery not found!");

  const nextPayload = { ...payload };

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
  deleteGallery,
};
