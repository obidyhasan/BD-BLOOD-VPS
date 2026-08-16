import httpStatus from "http-status";
import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";
import { isUuid, toSlug } from "../../shared/slugHelper";
import { assertGeographicHierarchy } from "../../shared/geographicHierarchy";

const uniqueInstitutionSlug = async (name: string, excludeId?: string) => {
  let base = toSlug(name) || "institution";
  let slug = base;
  let n = 1;
  while (
    await prisma.medicalInstitution.findFirst({
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

const createInstitution = async (payload: any) => {
  await assertGeographicHierarchy(
    prisma,
    payload.divisionId,
    payload.districtId,
    payload.upazilaId,
  );
  const slug = payload.slug || (await uniqueInstitutionSlug(payload.name));

  return prisma.medicalInstitution.create({
    data: {
      name: payload.name,
      type: payload.type,
      phone: payload.phone,
      address: payload.address,
      logo: payload.logo,
      coverImage: payload.coverImage,
      divisionId: payload.divisionId,
      districtId: payload.districtId,
      upazilaId: payload.upazilaId,
      openStatus: payload.openStatus,
      slug,
    },
  });
};

const getAllInstitutions = async (params: IGenericFilters, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const whereConditions: Prisma.MedicalInstitutionWhereInput = {
    isDeleted: false,
    ...((params as Record<string, string | undefined>).districtId ? { districtId: (params as Record<string, string | undefined>).districtId } : {}),
    ...((params as Record<string, string | undefined>).divisionId ? { divisionId: (params as Record<string, string | undefined>).divisionId } : {}),
    ...((params as Record<string, string | undefined>).upazilaId ? { upazilaId: (params as Record<string, string | undefined>).upazilaId } : {}),
    ...((params as Record<string, string | undefined>).searchTerm
      ? {
          OR: [
            { name: { contains: (params as Record<string, string>).searchTerm, mode: "insensitive" } },
            { type: { contains: (params as Record<string, string>).searchTerm, mode: "insensitive" } },
            { address: { contains: (params as Record<string, string>).searchTerm, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [result, total] = await Promise.all([
    prisma.medicalInstitution.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { [sortBy]: sortOrder },
      include: { division: true, district: true, upazila: true },
    }),
    prisma.medicalInstitution.count({
      where: whereConditions,
    }),
  ]);

  return { meta: { page, limit, total }, data: result };
};

const resolveInstitutionId = async (slugOrId: string) => {
  if (isUuid(slugOrId)) return slugOrId;

  const bySlug = await prisma.medicalInstitution.findFirst({
    where: { slug: slugOrId, isDeleted: false },
    select: { id: true },
  });
  if (bySlug) return bySlug.id;

  const institutions = await prisma.medicalInstitution.findMany({
    where: { isDeleted: false },
    select: { id: true, name: true },
  });

  const match = institutions.find((i) => toSlug(i.name) === slugOrId);
  if (!match) {
    throw new ApiError(httpStatus.NOT_FOUND, "Medical institution not found!");
  }
  return match.id;
};

const getSingleInstitution = async (slugOrId: string) => {
  const id = await resolveInstitutionId(slugOrId);
  return prisma.medicalInstitution.findUniqueOrThrow({
    where: { id, isDeleted: false },
  });
};

const getInstitutionBySlug = async (slug: string) => {
  const id = await resolveInstitutionId(slug);
  return prisma.medicalInstitution.findUniqueOrThrow({
    where: { id, isDeleted: false },
  });
};

const updateInstitution = async (
  id: string,
  payload: Prisma.MedicalInstitutionUpdateInput,
) => {
  const existing = await prisma.medicalInstitution.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing)
    throw new ApiError(httpStatus.NOT_FOUND, "Medical institution not found!");

  const scalar = payload as Prisma.MedicalInstitutionUncheckedUpdateInput;
  await assertGeographicHierarchy(
    prisma,
    typeof scalar.divisionId === "string" ? scalar.divisionId : existing.divisionId,
    typeof scalar.districtId === "string" ? scalar.districtId : existing.districtId,
    typeof scalar.upazilaId === "string" ? scalar.upazilaId : existing.upazilaId,
  );

  return prisma.medicalInstitution.update({ where: { id }, data: payload });
};

const deleteInstitution = async (id: string) => {
  const existing = await prisma.medicalInstitution.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing)
    throw new ApiError(httpStatus.NOT_FOUND, "Medical institution not found!");

  return prisma.medicalInstitution.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

export const MedicalInstitutionService = {
  createInstitution,
  getAllInstitutions,
  getSingleInstitution,
  getInstitutionBySlug,
  updateInstitution,
  deleteInstitution,
};
