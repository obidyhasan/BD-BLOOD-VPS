import httpStatus from "http-status";
import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper } from "../../helper/paginationHelper";

type FaqFilters = {
  category?: string;
  active?: boolean;
};

type CreateFaqPayload = {
  question: string;
  answer: string;
  category?: string;
  active?: boolean;
  order?: number;
};

const createFaq = async (payload: CreateFaqPayload) => {
  return prisma.faq.create({
    data: {
      question: payload.question,
      answer: payload.answer,
      category: payload.category,
      active: payload.active ?? true,
      order: payload.order ?? 0,
    },
  });
};

const getAllFaqs = async (params: FaqFilters, options: any) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const faqSortOrder = sortOrder as Prisma.SortOrder;

  const whereConditions: Prisma.FaqWhereInput = {
    isDeleted: false,
    ...(params.category ? { category: params.category } : {}),
    ...(params.active !== undefined ? { active: params.active } : {}),
  };

  const [result, total] = await Promise.all([
    prisma.faq.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy:
        sortBy === "order"
          ? [{ order: faqSortOrder }, { createdAt: "desc" }]
          : { [sortBy]: faqSortOrder },
    }),
    prisma.faq.count({ where: whereConditions }),
  ]);

  return { meta: { page, limit, total }, data: result };
};

const getSingleFaq = async (id: string) => {
  const faq = await prisma.faq.findUnique({
    where: { id, isDeleted: false },
  });

  if (!faq) {
    throw new ApiError(httpStatus.NOT_FOUND, "FAQ not found!");
  }

  return faq;
};

const updateFaq = async (id: string, payload: Prisma.FaqUpdateInput) => {
  const existing = await prisma.faq.findUnique({
    where: { id, isDeleted: false },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "FAQ not found!");
  }

  return prisma.faq.update({ where: { id }, data: payload });
};

const deleteFaq = async (id: string) => {
  const existing = await prisma.faq.findUnique({
    where: { id, isDeleted: false },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "FAQ not found!");
  }

  return prisma.faq.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

export const FaqService = {
  createFaq,
  getAllFaqs,
  getSingleFaq,
  updateFaq,
  deleteFaq,
};
