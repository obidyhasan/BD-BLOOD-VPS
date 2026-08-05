import httpStatus from "http-status";
import { AccountStatus, BlogStatus, Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";
import { IJWTPayload } from "../../types";
import { blogSearchableFields } from "./blog.constant";
import { isUuid, toSlug } from "../../shared/slugHelper";

const uniqueBlogSlug = async (title: string, excludeId?: string) => {
  let base = toSlug(title) || "blog";
  let slug = base;
  let n = 1;
  while (
    await prisma.blog.findFirst({
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

const toPublicBlog = <
  T extends { author: Record<string, unknown> },
>(blog: T) => {
  const {
    email: _email,
    phone: _phone,
    password: _password,
    phoneVerifiedAt: _phoneVerifiedAt,
    ...publicAuthor
  } = blog.author;
  return { ...blog, author: publicAuthor };
};

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

const blogSortByMap: Record<string, keyof Prisma.BlogOrderByWithRelationInput> =
  {
    created_at: "createdAt",
    updated_at: "updatedAt",
    published_at: "publishedAt",
  };

const normalizeBlogSortBy = (
  sortBy: string,
): keyof Prisma.BlogOrderByWithRelationInput => {
  const sortByField = blogSortByMap[sortBy] ?? sortBy;
  const allowedSortFields: Array<keyof Prisma.BlogOrderByWithRelationInput> = [
    "createdAt",
    "updatedAt",
    "publishedAt",
    "title",
    "reads",
    "status",
  ];

  return allowedSortFields.includes(
    sortByField as keyof Prisma.BlogOrderByWithRelationInput,
  )
    ? (sortByField as keyof Prisma.BlogOrderByWithRelationInput)
    : "createdAt";
};

const createBlog = async (user: IJWTPayload, payload: any) => {
  const donor = await getRequesterDonor(user);

  const slug = await uniqueBlogSlug(payload.title);

  return prisma.blog.create({
    data: {
      title: payload.title,
      slug,
      content: payload.content,
      coverImage: payload.coverImage,
      authorId: donor.id,
      status: BlogStatus.PENDING,
      publishedAt: null,
    },
    include: {
      author: { omit: { password: true } },
    },
  });
};

const getAllBlogs = async (params: IGenericFilters, options: IOptions, onlyApproved = false) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params as Record<string, string | undefined>;

  const andConditions: Prisma.BlogWhereInput[] = [{ isDeleted: false }];

  if (onlyApproved) {
    andConditions.push({ status: BlogStatus.APPROVED });
  }

  if (searchTerm) {
    andConditions.push({
      OR: blogSearchableFields.map((field) => ({
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

  const whereConditions: Prisma.BlogWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const orderByField = normalizeBlogSortBy(sortBy);

  const [result, total] = await Promise.all([
    prisma.blog.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { [orderByField]: sortOrder },
      include: {
        author: { omit: { password: true } },
      },
    }),
    prisma.blog.count({ where: whereConditions }),
  ]);

  return {
    meta: { page, limit, total },
    data: onlyApproved ? result.map(toPublicBlog) : result,
  };
};

const resolveBlogId = async (slugOrId: string, onlyApproved: boolean) => {
  if (isUuid(slugOrId)) return slugOrId;

  const bySlug = await prisma.blog.findFirst({
    where: {
      slug: slugOrId,
      isDeleted: false,
      ...(onlyApproved ? { status: BlogStatus.APPROVED } : {}),
    },
    select: { id: true },
  });
  if (bySlug) return bySlug.id;

  const blogs = await prisma.blog.findMany({
    where: {
      isDeleted: false,
      ...(onlyApproved ? { status: BlogStatus.APPROVED } : {}),
    },
    select: { id: true, title: true },
  });

  const match = blogs.find((b) => toSlug(b.title) === slugOrId);
  if (!match) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog not found!");
  }
  return match.id;
};

const getBlogBySlug = async (slug: string, onlyApproved = false) => {
  const blog = await prisma.blog.findFirst({
    where: {
      slug,
      isDeleted: false,
      ...(onlyApproved ? { status: BlogStatus.APPROVED } : {}),
    },
    include: {
      author: { omit: { password: true } },
    },
  });

  if (!blog) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog not found!");
  }

  return onlyApproved ? toPublicBlog(blog) : blog;
};

const getSingleBlog = async (slugOrId: string, onlyApproved = false) => {
  const id = await resolveBlogId(slugOrId, onlyApproved);

  const blog = await prisma.blog.findUniqueOrThrow({
    where: {
      id,
      isDeleted: false,
      ...(onlyApproved ? { status: BlogStatus.APPROVED } : {}),
    },
    include: {
      author: { omit: { password: true } },
    },
  });

  return onlyApproved ? toPublicBlog(blog) : blog;
};

const updateBlog = async (
  user: IJWTPayload,
  id: string,
  payload: Prisma.BlogUpdateInput,
) => {
  const donor = await getRequesterDonor(user);

  const existing = await prisma.blog.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Blog not found!");

  if (user.role !== "ADMIN" && existing.authorId !== donor.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not allowed to update this blog!",
    );
  }

  return prisma.blog.update({
    where: { id },
    data: {
      ...payload,
      status: user.role === "ADMIN" ? existing.status : BlogStatus.PENDING,
      publishedAt: null,
    },
  });
};

const updateBlogStatus = async (id: string, status: BlogStatus) => {
  const existing = await prisma.blog.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Blog not found!");

  return prisma.blog.update({
    where: { id },
    data: {
      status,
      publishedAt: status === BlogStatus.APPROVED ? new Date() : null,
    },
  });
};

const deleteBlog = async (user: IJWTPayload, id: string) => {
  const donor = await getRequesterDonor(user);
  const existing = await prisma.blog.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Blog not found!");

  if (user.role !== "ADMIN" && existing.authorId !== donor.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not allowed to delete this blog!",
    );
  }

  return prisma.blog.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

const incrementReadCount = async (id: string) => {
  const existing = await prisma.blog.findUnique({
    where: { id, isDeleted: false, status: BlogStatus.APPROVED },
  });
  if (!existing) return; // silently skip if not found

  await prisma.blog.update({
    where: { id },
    data: { reads: { increment: 1 } },
  });
};

export const BlogService = {
  createBlog,
  getAllBlogs,
  getSingleBlog,
  getBlogBySlug,
  updateBlog,
  updateBlogStatus,
  deleteBlog,
  incrementReadCount,
};
