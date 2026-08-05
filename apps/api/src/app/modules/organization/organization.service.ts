import httpStatus from "http-status";
import {
  OrganizationMemberStatus,
  PositionStatus,
  Prisma,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";
import { organizationSearchableFields } from "./organization.constant";
import { isUuid, toSlug } from "../../shared/slugHelper";

const NORMAL_DONOR_POSITION_NAME = "Normal Donor";

const createOrganization = async (payload: any) => {
  const result = await prisma.organization.create({
    data: {
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      address: payload.address,
      divisionId: payload.divisionId,
      districtId: payload.districtId,
      upazilaId: payload.upazilaId,
      description: payload.description,
      logo: payload.logo,
      type: payload.type,
      organizationStatus: payload.organizationStatus,
      verificationStatus:
        payload.verificationStatus ?? VerificationStatus.PENDING,
    },
  });

  return result;
};

const registerOrganization = async (payload: any, donorEmail: string) => {
  return prisma.$transaction(async (tx) => {
    const donor = await tx.donor.findUnique({
      where: { email: donorEmail, isDeleted: false },
      select: { id: true },
    });

    if (!donor) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Authenticated donor not found",
      );
    }

    const existingMembership = await tx.organizationMember.findUnique({
      where: { donorId: donor.id },
      include: {
        position: { select: { positionName: true, positionStatus: true } },
      },
    });

    const isAutoMembership =
      existingMembership?.position?.positionName === NORMAL_DONOR_POSITION_NAME &&
      existingMembership.position.positionStatus === PositionStatus.GENERAL;

    if (existingMembership && !isAutoMembership) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "You are already a member of an organization",
      );
    }

    const newOrg = await tx.organization.create({
      data: {
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        address: payload.address,
        divisionId: payload.divisionId,
        districtId: payload.districtId,
        upazilaId: payload.upazilaId,
        description: payload.description,
        logo: payload.logo,
        type: payload.type,
        verificationStatus: VerificationStatus.PENDING,
      },
    });

    // Find or create an EXECUTIVE position
    let executivePos = await tx.organizationPosition.findFirst({
      where: { level: "EXECUTIVE", isDeleted: false },
    });

    if (!executivePos) {
      executivePos = await tx.organizationPosition.create({
        data: {
          positionName: "President",
          positionOrder: 1,
          level: "EXECUTIVE",
        },
      });
    }

    const memberData = {
      organizationId: newOrg.id,
      positionId: executivePos.id,
      status: OrganizationMemberStatus.ACTIVE,
      isDeleted: false,
      deletedAt: null,
    };

    if (existingMembership) {
      await tx.organizationMember.update({
        where: { donorId: donor.id },
        data: memberData,
      });
    } else {
      await tx.organizationMember.create({
        data: {
          donorId: donor.id,
          ...memberData,
        },
      });
    }

    return newOrg;
  });
};

const getAllOrganizations = async (params: IGenericFilters, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params as Record<string, string | undefined>;

  const andConditions: Prisma.OrganizationWhereInput[] = [{ isDeleted: false }];

  if (searchTerm) {
    andConditions.push({
      OR: organizationSearchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: filterData[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.OrganizationWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [result, total] = await Promise.all([
    prisma.organization.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: {
            members: {
              where: {
                isDeleted: false,
                status: OrganizationMemberStatus.ACTIVE,
              },
            },
          },
        },
      },
    }),
    prisma.organization.count({ where: whereConditions }),
  ]);

  const [divisions, districts, upazilas] = await Promise.all([
    prisma.division.findMany({
      where: { id: { in: [...new Set(result.map((org) => org.divisionId))] } },
      select: { id: true, name: true },
    }),
    prisma.district.findMany({
      where: { id: { in: [...new Set(result.map((org) => org.districtId))] } },
      select: { id: true, name: true },
    }),
    prisma.upazila.findMany({
      where: { id: { in: [...new Set(result.map((org) => org.upazilaId))] } },
      select: { id: true, name: true },
    }),
  ]);
  const divisionById = new Map(
    divisions.map((division) => [division.id, division]),
  );
  const districtById = new Map(
    districts.map((district) => [district.id, district]),
  );
  const upazilaById = new Map(upazilas.map((upazila) => [upazila.id, upazila]));

  return {
    meta: { page, limit, total },
    data: result.map((org) => ({
      ...org,
      division: divisionById.get(org.divisionId)
        ? { name: divisionById.get(org.divisionId)!.name }
        : undefined,
      district: districtById.get(org.districtId)
        ? { name: districtById.get(org.districtId)!.name }
        : undefined,
      upazila: upazilaById.get(org.upazilaId)
        ? { name: upazilaById.get(org.upazilaId)!.name }
        : undefined,
    })),
  };
};

const getOrganizationBySlug = async (slug: string) => {
  if (isUuid(slug)) {
    return getSingleOrganization(slug);
  }

  const organizations = await prisma.organization.findMany({
    where: { isDeleted: false },
    select: { id: true, name: true },
  });

  const match = organizations.find((o) => toSlug(o.name) === slug);
  if (!match) {
    throw new ApiError(httpStatus.NOT_FOUND, "Organization not found!");
  }

  return getSingleOrganization(match.id);
};

const getSingleOrganization = async (id: string) => {
  const result = await prisma.organization.findUniqueOrThrow({
    where: { id, isDeleted: false },
    include: {
      _count: {
        select: {
          members: {
            where: {
              isDeleted: false,
              status: OrganizationMemberStatus.ACTIVE,
            },
          },
        },
      },
    },
  });

  const [division, district, upazila] = await Promise.all([
    prisma.division.findUnique({
      where: { id: result.divisionId },
      select: { name: true },
    }),
    prisma.district.findUnique({
      where: { id: result.districtId },
      select: { name: true },
    }),
    prisma.upazila.findUnique({
      where: { id: result.upazilaId },
      select: { name: true },
    }),
  ]);

  return {
    ...result,
    division: division ? { name: division.name } : undefined,
    district: district ? { name: district.name } : undefined,
    upazila: upazila ? { name: upazila.name } : undefined,
  };
};

const updateOrganization = async (
  id: string,
  payload: Prisma.OrganizationUpdateInput,
) => {
  const existing = await prisma.organization.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Organization not found!");
  }

  return prisma.organization.update({
    where: { id },
    data: payload,
  });
};

const updateOrganizationVerification = async (
  id: string,
  verificationStatus: VerificationStatus,
) => {
  const existing = await prisma.organization.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Organization not found!");
  }

  return prisma.organization.update({
    where: { id },
    data: { verificationStatus },
  });
};

const deleteOrganization = async (id: string) => {
  const existing = await prisma.organization.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Organization not found!");
  }

  return prisma.organization.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

const getOrganizationTree = async () => {
  const organizations = await prisma.organization.findMany({
    where: {
      canonical: true,
      isDeleted: false,
      organizationStatus: "ACTIVE",
      verificationStatus: VerificationStatus.VERIFIED,
    },
    orderBy: [{ level: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      level: true,
      parentId: true,
      divisionId: true,
      districtId: true,
      upazilaId: true,
      logo: true,
      address: true,
      _count: {
        select: {
          donorAffiliations: { where: { active: true } },
          members: {
            where: {
              isDeleted: false,
              status: OrganizationMemberStatus.ACTIVE,
              position: { level: { in: ["EXECUTIVE", "MANAGEMENT"] } },
            },
          },
        },
      },
    },
  });

  const [divisions, districts, upazilas] = await Promise.all([
    prisma.division.findMany({
      where: { id: { in: [...new Set(organizations.map((item) => item.divisionId))] } },
      select: { id: true, name: true },
    }),
    prisma.district.findMany({
      where: { id: { in: [...new Set(organizations.map((item) => item.districtId))] } },
      select: { id: true, name: true },
    }),
    prisma.upazila.findMany({
      where: { id: { in: [...new Set(organizations.map((item) => item.upazilaId))] } },
      select: { id: true, name: true },
    }),
  ]);
  const divisionNames = new Map(divisions.map((item) => [item.id, item.name]));
  const districtNames = new Map(districts.map((item) => [item.id, item.name]));
  const upazilaNames = new Map(upazilas.map((item) => [item.id, item.name]));

  type TreeNode = (typeof organizations)[number] & {
    division?: { name: string };
    district?: { name: string };
    upazila?: { name: string };
    children: TreeNode[];
  };
  const nodes = new Map<string, TreeNode>(
    organizations.map((organization) => [
      organization.id,
      {
        ...organization,
        division: divisionNames.get(organization.divisionId)
          ? { name: divisionNames.get(organization.divisionId)! }
          : undefined,
        district: districtNames.get(organization.districtId)
          ? { name: districtNames.get(organization.districtId)! }
          : undefined,
        upazila: upazilaNames.get(organization.upazilaId)
          ? { name: upazilaNames.get(organization.upazilaId)! }
          : undefined,
        children: [],
      },
    ]),
  );
  const roots: TreeNode[] = [];

  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  return roots;
};

const getCanonicalOrganizationByUpazila = async (upazilaId: string) => {
  const organization = await prisma.organization.findFirst({
    where: {
      upazilaId,
      level: "UPAZILA",
      canonical: true,
      isDeleted: false,
      organizationStatus: "ACTIVE",
      verificationStatus: VerificationStatus.VERIFIED,
    },
    select: {
      id: true,
      name: true,
      level: true,
      logo: true,
      address: true,
      upazilaId: true,
      districtId: true,
      divisionId: true,
    },
  });

  if (!organization) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "No canonical organization is configured for this Upazila.",
      "",
      "ORGANIZATION_NOT_CONFIGURED",
    );
  }

  const [division, district, upazila] = await Promise.all([
    prisma.division.findUnique({
      where: { id: organization.divisionId },
      select: { name: true },
    }),
    prisma.district.findUnique({
      where: { id: organization.districtId },
      select: { name: true },
    }),
    prisma.upazila.findUnique({
      where: { id: organization.upazilaId },
      select: { name: true },
    }),
  ]);

  return { ...organization, division, district, upazila };
};

const getAffiliatedDonors = async (organizationId: string) => {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId, isDeleted: false },
    select: { id: true },
  });
  if (!organization) {
    throw new ApiError(httpStatus.NOT_FOUND, "Organization not found!");
  }

  return prisma.donorOrganizationAffiliation.findMany({
    where: { organizationId, active: true },
    orderBy: { donor: { fullName: "asc" } },
    select: {
      id: true,
      assignedAt: true,
      source: true,
      donor: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          phoneVerifiedAt: true,
          profilePhoto: true,
          availabilityStatus: true,
          accountStatus: true,
          profileStatus: true,
          lastDonationDate: true,
          nextEligibleDonationDate: true,
          bloodGroup: { select: { groupName: true } },
          division: { select: { name: true } },
          district: { select: { name: true } },
          upazila: { select: { name: true } },
        },
      },
    },
  });
};

export const OrganizationService = {
  getOrganizationTree,
  getCanonicalOrganizationByUpazila,
  getAffiliatedDonors,
  createOrganization,
  registerOrganization,
  getAllOrganizations,
  getOrganizationBySlug,
  getSingleOrganization,
  updateOrganization,
  updateOrganizationVerification,
  deleteOrganization,
};
