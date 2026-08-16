import httpStatus from "http-status";
import { ArticleStatus, Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";
import { IJWTPayload } from "../../types";

const createMedicalInformation = async (user: IJWTPayload, payload: any) => {
  const creator = await prisma.donor.findUnique({
    where: { email: user.email, isDeleted: false },
    select: { id: true },
  });
  if (!creator) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  const inst = await prisma.medicalInstitution.findUnique({
    where: { id: payload.institutionId, isDeleted: false },
  });
  if (!inst) throw new ApiError(httpStatus.NOT_FOUND, "Medical institution not found!");

  return prisma.medicalInformation.create({
    data: {
      institutionId: payload.institutionId,
      title: payload.title,
      content: payload.content,
      category: payload.category,
      createdBy: creator.id,
      status: payload.status ?? ArticleStatus.DRAFT,
    },
    include: { institution: true },
  });
};

const getAllMedicalInformations = async (params: IGenericFilters, options: IOptions, management = false) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const filters = params as Record<string, string | undefined>;
  const whereConditions: Prisma.MedicalInformationWhereInput = {
    isDeleted: false,
    ...(management ? {} : { status: ArticleStatus.PUBLISHED }),
    ...(filters.institutionId ? { institutionId: filters.institutionId } : {}),
    ...(management && filters.status ? { status: filters.status as ArticleStatus } : {}),
    ...(filters.divisionId ? { institution: { divisionId: filters.divisionId } } : {}),
    ...(filters.districtId ? { institution: { districtId: filters.districtId } } : {}),
    ...(filters.upazilaId ? { institution: { upazilaId: filters.upazilaId } } : {}),
    ...(filters.searchTerm
      ? {
          OR: [
            { title: { contains: filters.searchTerm, mode: "insensitive" } },
            { content: { contains: filters.searchTerm, mode: "insensitive" } },
            { category: { contains: filters.searchTerm, mode: "insensitive" } },
          ],
        }
      : {}),
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
    where: { id, isDeleted: false, status: ArticleStatus.PUBLISHED },
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

