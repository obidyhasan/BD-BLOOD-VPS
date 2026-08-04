import httpStatus from "http-status";
import { ArticleStatus, Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";

const createMedicalInformation = async (payload: any) => {
  const inst = await prisma.medicalInstitution.findUnique({
    where: { id: payload.institutionId, isDeleted: false },
  });
  if (!inst) throw new ApiError(httpStatus.NOT_FOUND, "Medical institution not found!");

  return prisma.medicalInformation.create({
    data: {
      institutionId: payload.institutionId,
      title: payload.title,
      content: payload.content,
      createdBy: payload.createdBy,
      status: payload.status ?? ArticleStatus.DRAFT,
    },
    include: { institution: true },
  });
};

const getAllMedicalInformations = async (params: IGenericFilters, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const filters = params as Record<string, string | undefined>;
  const whereConditions: Prisma.MedicalInformationWhereInput = {
    isDeleted: false,
    ...(filters.institutionId ? { institutionId: filters.institutionId } : {}),
    ...(filters.status ? { status: filters.status as ArticleStatus } : {}),
  };

  const [result, total] = await Promise.all([
    prisma.medicalInformation.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { [sortBy]: sortOrder },
      include: { institution: true },
    }),
    prisma.medicalInformation.count({ where: whereConditions }),
  ]);

  return { meta: { page, limit, total }, data: result };
};

const getSingleMedicalInformation = async (id: string) => {
  return prisma.medicalInformation.findUniqueOrThrow({
    where: { id, isDeleted: false },
    include: { institution: true },
  });
};

const updateMedicalInformation = async (id: string, payload: Prisma.MedicalInformationUpdateInput) => {
  const existing = await prisma.medicalInformation.findUnique({ where: { id, isDeleted: false } });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Medical information not found!");

  return prisma.medicalInformation.update({ where: { id }, data: payload });
};

const deleteMedicalInformation = async (id: string) => {
  const existing = await prisma.medicalInformation.findUnique({ where: { id, isDeleted: false } });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Medical information not found!");

  return prisma.medicalInformation.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

export const MedicalInformationService = {
  createMedicalInformation,
  getAllMedicalInformations,
  getSingleMedicalInformation,
  updateMedicalInformation,
  deleteMedicalInformation,
};

