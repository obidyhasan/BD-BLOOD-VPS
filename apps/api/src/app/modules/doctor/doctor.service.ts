import httpStatus from "http-status";
import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";

const createDoctor = async (payload: any) => {
  const inst = await prisma.medicalInstitution.findUnique({
    where: { id: payload.institutionId, isDeleted: false },
  });
  if (!inst) throw new ApiError(httpStatus.NOT_FOUND, "Medical institution not found!");

  return prisma.doctor.create({
    data: {
      institutionId: payload.institutionId,
      name: payload.name,
      specialization: payload.specialization,
      phone: payload.phone,
      visitingHours: payload.visitingHours,
      experience: payload.experience,
    },
    include: { institution: true },
  });
};

const getAllDoctors = async (params: IGenericFilters, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const whereConditions: Prisma.DoctorWhereInput = {
    isDeleted: false,
    ...((params as Record<string, string | undefined>).institutionId ? { institutionId: (params as Record<string, string | undefined>).institutionId } : {}),
    ...((params as Record<string, string | undefined>).divisionId ? { institution: { divisionId: (params as Record<string, string>).divisionId } } : {}),
    ...((params as Record<string, string | undefined>).districtId ? { institution: { districtId: (params as Record<string, string>).districtId } } : {}),
    ...((params as Record<string, string | undefined>).upazilaId ? { institution: { upazilaId: (params as Record<string, string>).upazilaId } } : {}),
    ...((params as Record<string, string | undefined>).searchTerm
      ? {
          OR: [
            { name: { contains: (params as Record<string, string>).searchTerm, mode: "insensitive" } },
            { specialization: { contains: (params as Record<string, string>).searchTerm, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [result, total] = await Promise.all([
    prisma.doctor.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { [sortBy]: sortOrder },
      include: { institution: true },
    }),
    prisma.doctor.count({ where: whereConditions }),
  ]);

  return { meta: { page, limit, total }, data: result };
};

const getSingleDoctor = async (id: string) => {
  return prisma.doctor.findUniqueOrThrow({
    where: { id, isDeleted: false },
    include: { institution: true },
  });
};

const updateDoctor = async (id: string, payload: Prisma.DoctorUpdateInput) => {
  const existing = await prisma.doctor.findUnique({ where: { id, isDeleted: false } });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found!");

  return prisma.doctor.update({
    where: { id },
    data: payload,
  });
};

const deleteDoctor = async (id: string) => {
  const existing = await prisma.doctor.findUnique({ where: { id, isDeleted: false } });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found!");

  return prisma.doctor.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

export const DoctorService = {
  createDoctor,
  getAllDoctors,
  getSingleDoctor,
  updateDoctor,
  deleteDoctor,
};

