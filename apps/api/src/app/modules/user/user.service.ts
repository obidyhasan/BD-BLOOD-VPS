import httpStatus from "http-status";
import bcrypt from "bcryptjs";
import config from "../../config";
import { prisma } from "../../shared/prisma";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";
import { userSearchableFields } from "./user.constant";
import ApiError from "../../errors/ApiError";
import {
  AccountStatus,
  AffiliationSource,
  OrganizationMemberStatus,
  PositionLevel,
  PositionStatus,
  Prisma,
} from "@prisma/client";
import { IJWTPayload } from "../../types";
import { toSlug } from "../../shared/slugHelper";
import { cacheHelper } from "../../helper/cacheHelper";
import {
  resolveDonorAffiliation,
  resolveUpazilaOrganization,
  upsertDonorAffiliation,
} from "../../shared/donorAffiliation";
import {
  calculateDonorCapabilities,
  calculateProfileReadiness,
  ProfileFacts,
} from "../../shared/profileReadiness";

const uniqueDonorSlug = async (fullName: string, excludeId?: string) => {
  let base = toSlug(fullName) || "donor";
  let slug = base;
  let n = 1;
  while (
    await prisma.donor.findFirst({
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

const createUser = async (payload: any) => {
  // Single lookup instead of two separate findUnique calls on the same
  // email (one filtered isDeleted:true, one isDeleted:false) — the
  // isDeleted branch is derived from the one row instead.
  const existingByEmail = await prisma.donor.findUnique({
    where: { email: payload.email },
  });

  if (existingByEmail && !existingByEmail.isDeleted) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "User with this email already exists!",
    );
  }

  if (existingByEmail && existingByEmail.isDeleted) {
    // Reactivating a soft-deleted account: bcrypt only needs to run once
    // we know we're actually going to write, so it's computed here rather
    // than unconditionally at the top of the function.
    const hashPassword = await bcrypt.hash(
      payload.password,
      Number(config.bcrypt_salt_number),
    );

    const result = await prisma.donor.update({
      where: {
        email: payload.email,
      },
      data: {
        ...payload,
        password: hashPassword,
        isDeleted: false,
        accountStatus: AccountStatus.ACTIVE,
      },
    });

    return result;
  }

  // New-user path: these four checks are independent of each other, so
  // run them concurrently instead of as four sequential round trips.
  const [existingUserByPhone, bloodGroup, referrer, referenceDonor] =
    await Promise.all([
      payload.phone
        ? prisma.donor.findUnique({
            where: { phone: payload.phone, isDeleted: false },
          })
        : Promise.resolve(null),
      prisma.bloodGroup.findUnique({ where: { id: payload.bloodGroupId } }),
      payload.referrerId
        ? prisma.donor.findUnique({ where: { id: payload.referrerId } })
        : Promise.resolve(null),
      payload.referenceEmail && payload.referenceEmail.trim() !== ""
        ? prisma.donor.findUnique({
            where: { email: payload.referenceEmail, isDeleted: false },
          })
        : Promise.resolve(null),
    ]);

  if (payload.phone && existingUserByPhone) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "User with this phone number already exists!",
    );
  }

  if (!bloodGroup) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invalid Blood Group ID!");
  }

  if (payload.referrerId && !referrer) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invalid Referrer ID!");
  }

  if (payload.referenceEmail && payload.referenceEmail.trim() !== "") {
    if (!referenceDonor) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "The reference email does not belong to any registered donor. Please provide a valid donor email address.",
      );
    }
    // Set referenceId from the found donor's ID
    payload.referenceId = referenceDonor.id;
  }

  // Remove referenceEmail from payload so it doesn't get passed to prisma.donor.create
  delete payload.referenceEmail;

  // Independent of each other (CPU-bound hash vs. a DB-backed slug
  // uniqueness loop) — run concurrently rather than back-to-back.
  const [hashPassword, slug] = await Promise.all([
    bcrypt.hash(payload.password, Number(config.bcrypt_salt_number)),
    uniqueDonorSlug(payload.fullName),
  ]);

  const result = await prisma.donor.create({
    data: {
      ...payload,
      password: hashPassword,
      slug,
    },
  });

  return result;
};

const getAllUsers = async (params: IGenericFilters, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params as Record<string, string | undefined>;

  const andConditions: Prisma.DonorWhereInput[] = [{ isDeleted: false }];

  if (searchTerm) {
    andConditions.push({
      OR: userSearchableFields.map((field) => ({
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

  const whereConditions: Prisma.DonorWhereInput =
    andConditions.length > 0
      ? {
          AND: andConditions,
        }
      : {};

  const [result, total] = await Promise.all([
    prisma.donor.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: {
        [sortBy]: sortOrder,
      },
      omit: {
        password: true,
      },
      include: {
        bloodGroup: true,
        division: true,
        district: true,
        upazila: true,
      },
    }),
    prisma.donor.count({
      where: whereConditions,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getSingleUser = async (email: string) => {
  const user = await prisma.donor.findUniqueOrThrow({
    where: {
      email,
      accountStatus: AccountStatus.ACTIVE,
      isDeleted: false,
    },
    omit: {
      password: true,
    },
  });

  return user;
};

const buildProfileFacts = (
  donor: {
    fullName: string;
    phone: string | null;
    isVerified: boolean;
    bloodGroupId: string;
    divisionId: string | null;
    districtId: string | null;
    upazilaId: string | null;
    accountStatus: AccountStatus;
    availabilityStatus: "AVAILABLE" | "UNAVAILABLE";
    nextEligibleDonationDate: Date | null;
  },
  affiliationActive: boolean,
  geographyValid: boolean,
): ProfileFacts => ({
  fullName: donor.fullName,
  phone: donor.phone,
  emailVerified: donor.isVerified,
  bloodGroupId: donor.bloodGroupId,
  divisionId: donor.divisionId,
  districtId: donor.districtId,
  upazilaId: donor.upazilaId,
  affiliationActive,
  geographyValid,
  accountActive: donor.accountStatus === AccountStatus.ACTIVE,
  availabilityAvailable: donor.availabilityStatus === "AVAILABLE",
  nextEligibleDonationDate: donor.nextEligibleDonationDate,
});

const getMyProfile = async (user: IJWTPayload) => {
  const profileInfo = await prisma.donor.findUniqueOrThrow({
    where: {
      email: user.email,
      accountStatus: AccountStatus.ACTIVE,
      isDeleted: false,
    },
    omit: { password: true },
    include: {
      bloodGroup: true,
      division: true,
      district: true,
      upazila: true,
      affiliations: {
        where: { active: true },
        take: 1,
        include: {
          organization: { select: { id: true, name: true, level: true } },
        },
      },
      organization: {
        include: { position: { select: { level: true } } },
      },
    },
  });

  const geographyValid = Boolean(
    profileInfo.divisionId &&
      profileInfo.districtId &&
      profileInfo.upazilaId &&
      profileInfo.upazila?.districtId === profileInfo.districtId &&
      profileInfo.district?.divisionId === profileInfo.divisionId,
  );
  const affiliation = await resolveDonorAffiliation(prisma, profileInfo.id);
  const facts = buildProfileFacts(
    profileInfo,
    Boolean(affiliation),
    geographyValid,
  );
  const readiness = calculateProfileReadiness(facts, profileInfo.updatedAt);
  const capabilities = calculateDonorCapabilities(facts, readiness);
  capabilities.canAccessOrganizationDashboard = Boolean(
    profileInfo.organization?.status === OrganizationMemberStatus.ACTIVE &&
      !profileInfo.organization.isDeleted &&
      (profileInfo.organization.position.level === PositionLevel.EXECUTIVE ||
        profileInfo.organization.position.level === PositionLevel.MANAGEMENT),
  );
  capabilities.canCreateDonationPost = false;

  return {
    ...profileInfo,
    profileStatus: readiness.status,
    missingProfileFields: readiness.missingFields,
    emailVerified: profileInfo.isVerified,
    phoneVerified: Boolean(profileInfo.phoneVerifiedAt),
    affiliation: profileInfo.affiliations[0] ?? affiliation,
    cooldown: {
      lastDonationAt: profileInfo.lastDonationDate,
      nextEligibleDonationAt: profileInfo.nextEligibleDonationDate,
      eligibleNow: !capabilities.nextEligibleDonationAt ||
        capabilities.nextEligibleDonationAt <= new Date(),
    },
    capabilities,
  };
};

const NORMAL_DONOR_POSITION_NAME = "Normal Donor";

const getNormalDonorMembershipPosition = async (
  tx: Prisma.TransactionClient,
) => {
  const position = await tx.organizationPosition.findFirst({
    where: {
      isDeleted: false,
      positionName: NORMAL_DONOR_POSITION_NAME,
      level: PositionLevel.SUPPORT,
      positionStatus: PositionStatus.GENERAL,
    },
    orderBy: [{ positionOrder: "asc" }, { createdAt: "asc" }],
  });

  if (position) return position;

  return tx.organizationPosition.create({
    data: {
      positionName: NORMAL_DONOR_POSITION_NAME,
      positionOrder: 999,
      level: PositionLevel.SUPPORT,
      positionStatus: PositionStatus.GENERAL,
    },
  });
};

const syncDonorOrganizationMembership = async (
  tx: Prisma.TransactionClient,
  donorId: string,
  upazilaId?: string,
) => {
  if (!upazilaId) {
    return null;
  }

  const upazila = await tx.upazila.findFirst({
    where: { id: upazilaId, isDeleted: false },
    select: {
      id: true,
      name: true,
      districtId: true,
      district: {
        select: {
          id: true,
          name: true,
          divisionId: true,
          division: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!upazila) {
    throw new ApiError(httpStatus.NOT_FOUND, "Upazila not found!");
  }

  const organization = await resolveUpazilaOrganization(tx, upazila.id);

  if (!organization) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      `No organization is configured for ${upazila.name}.`,
    );
  }

  await upsertDonorAffiliation(tx, {
    donorId,
    organizationId: organization.id,
    upazilaId: upazila.id,
    source: AffiliationSource.PROFILE,
  });

  const position = await getNormalDonorMembershipPosition(tx);
  const existingMembership = await tx.organizationMember.findUnique({
    where: { donorId },
    include: {
      position: {
        select: {
          level: true,
          positionName: true,
          positionStatus: true,
        },
      },
    },
  });

  const isAutoMembership =
    existingMembership?.position?.positionName === NORMAL_DONOR_POSITION_NAME &&
    existingMembership.position.positionStatus === PositionStatus.GENERAL;

  if (existingMembership && !isAutoMembership) {
    return existingMembership;
  }

  if (existingMembership) {
    return tx.organizationMember.update({
      where: { donorId },
      data: {
        organizationId: organization.id,
        positionId: position.id,
        status: OrganizationMemberStatus.ACTIVE,
        isDeleted: false,
        deletedAt: null,
      },
      include: {
        organization: true,
        donor: { omit: { password: true } },
        position: true,
      },
    });
  }

  return tx.organizationMember.create({
    data: {
      organizationId: organization.id,
      donorId,
      positionId: position.id,
      status: OrganizationMemberStatus.ACTIVE,
    },
    include: {
      organization: true,
      donor: { omit: { password: true } },
      position: true,
    },
  });
};

const updateMyProfile = async (
  user: IJWTPayload,
  payload: Prisma.DonorUpdateInput,
) => {
  const userInfo = await prisma.donor.findUnique({
    where: {
      email: user?.email,
      accountStatus: AccountStatus.ACTIVE,
      isDeleted: false,
    },
  });

  if (!userInfo) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "User profile not found or account is not active!",
    );
  }

  await prisma.$transaction(async (tx) => {
    const payloadData = payload as Prisma.DonorUncheckedUpdateInput;
    const nextData: Prisma.DonorUncheckedUpdateInput = { ...payloadData };
    const requestedUpazilaId =
      typeof payloadData.upazilaId === "string"
        ? payloadData.upazilaId
        : undefined;
    const targetUpazilaId = requestedUpazilaId ?? userInfo.upazilaId ?? undefined;

    if (targetUpazilaId) {
      const upazila = await tx.upazila.findFirst({
        where: { id: targetUpazilaId, isDeleted: false },
        select: {
          id: true,
          districtId: true,
          district: {
            select: {
              divisionId: true,
              isDeleted: true,
              division: { select: { isDeleted: true } },
            },
          },
        },
      });

      if (
        !upazila ||
        upazila.district.isDeleted ||
        upazila.district.division.isDeleted
      ) {
        throw new ApiError(httpStatus.NOT_FOUND, "Valid Upazila not found!");
      }

      if (
        typeof payloadData.districtId === "string" &&
        payloadData.districtId !== upazila.districtId
      ) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "District does not belong to the selected Upazila.",
        );
      }
      if (
        typeof payloadData.divisionId === "string" &&
        payloadData.divisionId !== upazila.district.divisionId
      ) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Division does not belong to the selected District.",
        );
      }

      nextData.upazilaId = upazila.id;
      nextData.districtId = upazila.districtId;
      nextData.divisionId = upazila.district.divisionId;
    }

    const updatedUser = await tx.donor.update({
      where: { email: userInfo.email },
      data: nextData,
    });

    if (targetUpazilaId) {
      await syncDonorOrganizationMembership(tx, userInfo.id, targetUpazilaId);
    }

    const [affiliation, ancestry] = await Promise.all([
      resolveDonorAffiliation(tx, userInfo.id),
      updatedUser.divisionId && updatedUser.districtId && updatedUser.upazilaId
        ? tx.upazila.findFirst({
            where: {
              id: updatedUser.upazilaId,
              districtId: updatedUser.districtId,
              isDeleted: false,
              district: {
                divisionId: updatedUser.divisionId,
                isDeleted: false,
                division: { isDeleted: false },
              },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);
    const facts = buildProfileFacts(
      updatedUser,
      Boolean(affiliation),
      Boolean(ancestry),
    );
    const readiness = calculateProfileReadiness(facts);

    await tx.donor.update({
      where: { id: userInfo.id },
      data: {
        profileStatus: readiness.status,
        profileCompletedAt:
          readiness.status === "COMPLETE"
            ? (userInfo.profileCompletedAt ?? readiness.completedAt)
            : null,
      },
    });
  });

  return getMyProfile(user);
};

const deleteUser = async (user: IJWTPayload) => {
  const userInfo = await prisma.donor.findUnique({
    where: {
      email: user?.email,
      accountStatus: AccountStatus.ACTIVE,
      isDeleted: false,
    },
  });

  if (!userInfo) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "User profile not found or account is not active!",
    );
  }

  const result = await prisma.donor.update({
    where: {
      email: userInfo.email,
    },
    data: {
      isDeleted: true,
    },
  });

  await cacheHelper.invalidateCache(`auth:userCheck:${userInfo.email}`);

  return result;
};

const getUserById = async (id: string) => {
  const user = await prisma.donor.findUniqueOrThrow({
    where: {
      id,
      isDeleted: false,
    },
    omit: {
      password: true,
    },
  });
  return user;
};

const adminUpdateUserById = async (
  id: string,
  payload: Prisma.DonorUpdateInput,
) => {
  const existing = await prisma.donor.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  const result = await prisma.donor.update({
    where: { id },
    data: {
      ...payload,
      verifiedAt:
        (payload as any).isVerified === true
          ? new Date()
          : (payload as any).isVerified === false
            ? null
            : undefined,
    } as Prisma.DonorUpdateInput,
    omit: { password: true },
  });

  // This update can change isVerified/accountStatus/role/isDeleted, all of
  // which the auth middleware caches per-email for a few seconds — bust it
  // now so a suspend/verify/role change is enforced on the user's very
  // next request instead of waiting out the TTL.
  await cacheHelper.invalidateCache(`auth:userCheck:${existing.email}`);

  return result;
};

const publicDonorSelect = {
  id: true,
  slug: true,
  fullName: true,
  bloodGroupId: true,
  divisionId: true,
  districtId: true,
  upazilaId: true,
  lastDonationDate: true,
  nextEligibleDonationDate: true,
  availabilityStatus: true,
  profilePhoto: true,
  bio: true,
  isVerified: true,
  phoneVerifiedAt: true,
  createdAt: true,
  bloodGroup: { select: { groupName: true } },
  division: { select: { id: true, name: true } },
  district: { select: { id: true, name: true } },
  upazila: { select: { id: true, name: true } },
  affiliations: {
    where: { active: true },
    take: 1,
    select: {
      organization: { select: { id: true, name: true, address: true } },
    },
  },
} satisfies Prisma.DonorSelect;

type PublicDonorRow = Prisma.DonorGetPayload<{
  select: typeof publicDonorSelect;
}>;

const toPublicDonor = (donor: PublicDonorRow) => {
  const { phoneVerifiedAt, affiliations, ...safeDonor } = donor;
  return {
    ...safeDonor,
    phoneVerified: Boolean(phoneVerifiedAt),
    organization: affiliations[0] ?? null,
  };
};

const publicDonorWhere: Prisma.DonorWhereInput = {
  isDeleted: false,
  accountStatus: AccountStatus.ACTIVE,
  isVerified: true,
  profileStatus: "COMPLETE",
};

const getPublicDonors = async (params: IGenericFilters, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params as Record<string, string | undefined>;

  const andConditions: Prisma.DonorWhereInput[] = [publicDonorWhere];

  if (searchTerm) {
    andConditions.push({
      fullName: { contains: searchTerm, mode: "insensitive" },
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: { equals: filterData[key] },
      })),
    });
  }

  const whereConditions: Prisma.DonorWhereInput = { AND: andConditions };
  const [result, total] = await Promise.all([
    prisma.donor.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { [sortBy]: sortOrder },
      select: publicDonorSelect,
    }),
    prisma.donor.count({ where: whereConditions }),
  ]);

  return { meta: { page, limit, total }, data: result.map(toPublicDonor) };
};

const getPublicDonorById = async (id: string) => {
  const donor = await prisma.donor.findFirstOrThrow({
    where: { AND: [{ id }, publicDonorWhere] },
    select: publicDonorSelect,
  });
  return toPublicDonor(donor);
};

const getPublicDonorBySlug = async (slug: string) => {
  const donor = await prisma.donor.findFirst({
    where: { slug, ...publicDonorWhere },
    select: publicDonorSelect,
  });

  if (!donor) {
    throw new ApiError(httpStatus.NOT_FOUND, "Donor not found!");
  }

  return toPublicDonor(donor);
};

export const UserService = {
  createUser,
  getAllUsers,
  getMyProfile,
  updateMyProfile,
  getSingleUser,
  deleteUser,
  getUserById,
  adminUpdateUserById,
  getPublicDonors,
  getPublicDonorById,
  getPublicDonorBySlug,
};
