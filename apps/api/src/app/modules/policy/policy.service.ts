import { PolicyCategory, Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";

const createPolicy = async (payload: {
  category: PolicyCategory;
  title: string;
  description: string;
  active?: boolean;
}) => {
  return prisma.policy.create({ data: payload });
};

const getAllPolicies = async (params?: { category?: PolicyCategory; active?: boolean }) => {
  const where: Prisma.PolicyWhereInput = { isDeleted: false };
  if (params?.category) where.category = params.category;
  if (params?.active !== undefined) where.active = params.active;

  return prisma.policy.findMany({ where, orderBy: { createdAt: "desc" } });
};

const getSinglePolicy = async (id: string) => {
  return prisma.policy.findUniqueOrThrow({ where: { id, isDeleted: false } });
};

const updatePolicy = async (
  id: string,
  payload: Partial<{
    category: PolicyCategory;
    title: string;
    description: string;
    active: boolean;
  }>,
) => {
  const existing = await prisma.policy.findUnique({ where: { id, isDeleted: false } });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Policy not found!");
  return prisma.policy.update({ where: { id }, data: payload });
};

const deletePolicy = async (id: string) => {
  const existing = await prisma.policy.findUnique({ where: { id, isDeleted: false } });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Policy not found!");
  return prisma.policy.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

export const PolicyService = {
  createPolicy,
  getAllPolicies,
  getSinglePolicy,
  updatePolicy,
  deletePolicy,
};
