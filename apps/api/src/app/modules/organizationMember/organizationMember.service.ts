import httpStatus from "http-status";
import {
  AccountStatus,
  GovernanceCategory,
  OrganizationMemberStatus,
  Prisma,
  PositionLevel,
  PositionStatus,
  Role,
} from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import {
  assertCanAccessOrganizationDashboard,
  assertCanManageMember,
  canAccessOrganizationDashboard,
} from "../../middlewares/orgAccess";
import { IJWTPayload } from "../../types";
import { getActiveActorDonor } from "../../shared/actorDonor";

const NORMAL_DONOR_POSITION_NAME = "Normal Donor";

// Every active governance scope, including National, resolves to a canonical
// Organization row. Nullable organization IDs are retained only for legacy
// records and are not produced by new assignments.
const LEADERSHIP_MEMBER_CAP = 11;

const governanceSeatKey = (
  organizationId: string | null,
  category: GovernanceCategory,
  positionId: string,
) => `${organizationId ?? "CENTRAL"}:${category}:${positionId}`;

type LeadershipScope = {
  level: PositionLevel;
  category: GovernanceCategory;
  organizationId?: string;
  divisionId?: string;
  districtId?: string;
};

/**
 * Resolves a leadership scope down to the organizationId to filter on.
 * Returns:
 *  - a string  -> filter to that specific organizationId
 *  - "NONE"    -> no organization matches the requested division/district
 *                 (caller should short-circuit to an empty result)
 */
const NO_MATCHING_ORGANIZATION = "NONE" as const;

const resolveLeadershipOrganizationId = async (
  scope: LeadershipScope,
): Promise<string | null | typeof NO_MATCHING_ORGANIZATION> => {
  if (scope.organizationId) return scope.organizationId;

  if (scope.districtId) {
    const org = await prisma.organization.findFirst({
      where: {
        districtId: scope.districtId,
        level: "DISTRICT",
        canonical: true,
        isDeleted: false,
      },
      select: { id: true },
    });
    return org?.id ?? NO_MATCHING_ORGANIZATION;
  }

  if (scope.divisionId) {
    const org = await prisma.organization.findFirst({
      where: {
        divisionId: scope.divisionId,
        level: "DIVISION",
        canonical: true,
        isDeleted: false,
      },
      select: { id: true },
    });
    return org?.id ?? NO_MATCHING_ORGANIZATION;
  }

  const central = await prisma.organization.findFirst({
    where: { level: "CENTRAL", canonical: true, isDeleted: false },
    select: { id: true },
  });
  return central?.id ?? NO_MATCHING_ORGANIZATION;
};

const publicMemberDonorSelect = {
  id: true,
  slug: true,
  fullName: true,
  profilePhoto: true,
  bio: true,
  isVerified: true,
  bloodGroup: { select: { groupName: true } },
  division: { select: { id: true, name: true } },
  district: { select: { id: true, name: true } },
  upazila: { select: { id: true, name: true } },
} as const;

type MembershipWithPosition = {
  position?: { positionName?: string; positionStatus?: PositionStatus } | null;
} | null;

const isAutoDonorMembership = (membership?: MembershipWithPosition) =>
  membership?.position?.positionName === NORMAL_DONOR_POSITION_NAME &&
  membership.position.positionStatus === PositionStatus.GENERAL;

const joinOrganization = async (
  user: IJWTPayload,
  payload: { organizationId: string; positionId: string },
) => {
  const donor = await getActiveActorDonor(user);

  const existingMembership = await prisma.organizationMember.findFirst({
    where: { donorId: donor.id, isDeleted: false },
    include: {
      position: { select: { positionName: true, positionStatus: true } },
    },
  });

  if (existingMembership && !isAutoDonorMembership(existingMembership)) {
    throw new ApiError(httpStatus.CONFLICT, "You are already a member of an organization!");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: payload.organizationId, isDeleted: false },
  });
  if (!organization) {
    throw new ApiError(httpStatus.NOT_FOUND, "Organization not found!");
  }

  const position = await prisma.organizationPosition.findUnique({
    where: { id: payload.positionId, isDeleted: false },
  });
  if (!position) {
    throw new ApiError(httpStatus.NOT_FOUND, "Organization position not found!");
  }
  const data = {
    organizationId: payload.organizationId,
    positionId: payload.positionId,
    status: OrganizationMemberStatus.PENDING,
    isDeleted: false,
    deletedAt: null,
  };

  return existingMembership
    ? prisma.organizationMember.update({
        where: { donorId: donor.id },
        data,
        include: {
          organization: true,
          donor: { omit: { password: true } },
          position: true,
        },
      })
    : prisma.organizationMember.create({
        data: { ...data, donorId: donor.id },
        include: {
          organization: true,
          donor: { omit: { password: true } },
          position: true,
        },
      });
};

const getMyMembership = async (user: IJWTPayload) => {
  const donor = await getActiveActorDonor(user);
  const membership = await prisma.organizationMember.findFirst({
    where: { donorId: donor.id, isDeleted: false },
    include: {
      organization: true,
      position: true,
    },
  });

  if (!membership) return null;

  return {
    ...membership,
    canAccessDashboard:
      membership.status === OrganizationMemberStatus.ACTIVE &&
      canAccessOrganizationDashboard(membership),
  };
};

const getPublicLeadershipMembers = async (scope: LeadershipScope) => {
  const resolvedOrganizationId = await resolveLeadershipOrganizationId(scope);

  if (resolvedOrganizationId === NO_MATCHING_ORGANIZATION) {
    // Requested division/district has no matching geo-organization —
    // nothing to show rather than surfacing an error to public visitors.
    return [];
  }

  return prisma.organizationMember.findMany({
    where: {
      status: OrganizationMemberStatus.ACTIVE,
      isDeleted: false,
      organizationId: resolvedOrganizationId,
      position: {
        isDeleted: false,
      },
      category: scope.category,
    },
    select: {
      id: true,
      organizationId: true,
      donorId: true,
      positionId: true,
      category: true,
      joinedAt: true,
      status: true,
      donor: { select: publicMemberDonorSelect },
      position: true,
      organization: { select: { id: true, name: true } },
    },
    orderBy: [{ position: { positionOrder: "asc" } }, { joinedAt: "asc" }],
    take: LEADERSHIP_MEMBER_CAP,
  });
};

const getPublicOrganizationMembers = async (organizationId: string) => {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId, isDeleted: false },
  });
  if (!organization) throw new ApiError(httpStatus.NOT_FOUND, "Organization not found!");

  // Scoped to EXECUTIVE (Committee) and MANAGEMENT (Advisor) only, mirroring
  // assertLeadershipCapacityAvailable's "max 11 active EXECUTIVE/MANAGEMENT
  // members per organization" rule and the AllOrganization directory page's
  // Committee/Advisor tabs. Without this filter, the public org profile page
  // (reached via Division -> District -> Upazila navigation) rendered every
  // ACTIVE member — including the uncapped, auto-created "Normal Donor"
  // (SUPPORT-level) memberships from syncDonorOrganizationMembership — so a
  // page meant to show up to 11 Committee + 11 Advisor members instead
  // listed potentially hundreds of ordinary donors alongside them.
  return prisma.organizationMember.findMany({
    where: {
      organizationId,
      status: OrganizationMemberStatus.ACTIVE,
      isDeleted: false,
      position: {
        isDeleted: false,
        level: { in: [PositionLevel.EXECUTIVE, PositionLevel.MANAGEMENT] },
      },
    },
    select: {
      id: true,
      organizationId: true,
      donorId: true,
      positionId: true,
      category: true,
      joinedAt: true,
      status: true,
      donor: { select: publicMemberDonorSelect },
      position: true,
    },
    orderBy: [
      { category: "asc" },
      { position: { positionOrder: "asc" } },
      { joinedAt: "asc" },
    ],
    take: LEADERSHIP_MEMBER_CAP * 2,
  });
};

// The frontend calls this with no page/limit and renders `data` as a flat
// array (no pagination UI exists for it today), so switching this to real
// skip/take pagination would silently truncate the admin members list to
// one page client-side — a frontend behavior change out of scope for this
// backend pass. Instead: cap the result set so the query itself can no
// longer run away unbounded as the platform grows, which was the actual
// risk (this previously had no skip/take at all). Wiring up real
// pagination end-to-end should be a follow-up that also updates the
// frontend to request/render pages.
const ALL_MEMBERS_HARD_CAP = 1000;

const getAllOrganizationMembers = async () => {
  return prisma.organizationMember.findMany({
    where: { isDeleted: false },
    take: ALL_MEMBERS_HARD_CAP,
    include: {
      organization: { select: { id: true, name: true } },
      donor: { omit: { password: true }, include: { bloodGroup: true } },
      position: true,
    },
    orderBy: { joinedAt: "asc" },
  });
};

const getOrganizationMembers = async (
  user: IJWTPayload,
  organizationId: string,
) => {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId, isDeleted: false },
  });
  if (!organization) throw new ApiError(httpStatus.NOT_FOUND, "Organization not found!");

  if (user.role !== Role.ADMIN) {
    await assertCanAccessOrganizationDashboard(user, organizationId);
  }

  return prisma.organizationMember.findMany({
    where: { organizationId, isDeleted: false },
    include: {
      donor: {
        omit: { password: true },
        include: {
          bloodGroup: true,
          division: { select: { id: true, name: true } },
          district: { select: { id: true, name: true } },
          upazila: { select: { id: true, name: true } },
        },
      },
      position: true,
    },
    orderBy: { joinedAt: "asc" },
  });
};

/**
 * Server-side enforcement of the "max 11 active EXECUTIVE/MANAGEMENT
 * members per organization" rule. Intentionally scoped to EXECUTIVE and
 * MANAGEMENT only — SUPPORT-level positions (which includes the "Normal
 * Donor" auto-membership created by syncDonorOrganizationMembership in
 * user.service.ts) are uncapped and must keep working exactly as before.
 */
const assertLeadershipCapacityAvailable = async (
  organizationId: string | null,
  category: GovernanceCategory,
  excludeDonorId?: string,
  db: typeof prisma | Parameters<Parameters<typeof prisma.$transaction>[0]>[0] = prisma,
) => {
  const activeCount = await db.organizationMember.count({
    where: {
      organizationId,
      category,
      status: OrganizationMemberStatus.ACTIVE,
      isDeleted: false,
      ...(excludeDonorId ? { donorId: { not: excludeDonorId } } : {}),
      position: {
        isDeleted: false,
        level: { in: [PositionLevel.EXECUTIVE, PositionLevel.MANAGEMENT] },
      },
    },
  });

  if (activeCount >= LEADERSHIP_MEMBER_CAP) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `This organization already has the maximum of ${LEADERSHIP_MEMBER_CAP} active ${category.toLowerCase()} members. Remove or deactivate a member before appointing another.`,
    );
  }
};

/**
 * Requirement 2 ("National Committee"): exactly one of the 11 National
 * (organizationId: null) EXECUTIVE seats is reserved for the Admin (a
 * Donor with role = ADMIN). Non-admin donors may fill at most
 * LEADERSHIP_MEMBER_CAP - 1 of those seats; the final seat is only
 * assignable to a Donor whose role is ADMIN. Once an Admin-role donor
 * holds an active seat, this stops applying to the remaining assignments —
 * assertLeadershipCapacityAvailable's ordinary 11-seat cap already covers
 * the rest.
 */
const assertNationalAdminSeatReserved = async (
  organizationId: string,
  excludeDonorId?: string,
  db: typeof prisma | Parameters<Parameters<typeof prisma.$transaction>[0]>[0] = prisma,
) => {
  const [activeCount, adminSeatTaken] = await Promise.all([
    db.organizationMember.count({
      where: {
        organizationId,
        status: OrganizationMemberStatus.ACTIVE,
        isDeleted: false,
        ...(excludeDonorId ? { donorId: { not: excludeDonorId } } : {}),
        position: { isDeleted: false, level: PositionLevel.EXECUTIVE },
      },
    }),
    db.organizationMember.findFirst({
      where: {
        organizationId,
        status: OrganizationMemberStatus.ACTIVE,
        isDeleted: false,
        ...(excludeDonorId ? { donorId: { not: excludeDonorId } } : {}),
        position: { isDeleted: false, level: PositionLevel.EXECUTIVE },
        donor: { role: Role.ADMIN },
      },
      select: { id: true },
    }),
  ]);

  if (!adminSeatTaken && activeCount >= LEADERSHIP_MEMBER_CAP - 1) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "The final National Committee seat is reserved for the Admin. Assign the Admin donor before filling the remaining seats.",
    );
  }
};

const updateMemberStatus = async (
  user: IJWTPayload,
  memberId: string,
  status: OrganizationMemberStatus,
) => {
  await assertCanManageMember(user, memberId);

  const existing = await prisma.organizationMember.findUnique({
    where: { id: memberId, isDeleted: false },
    include: {
      position: { select: { level: true } },
      donor: { select: { role: true } },
      organization: { select: { level: true } },
    },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Organization member not found!");

  return prisma.$transaction(async (tx) => {
    if (
      status === OrganizationMemberStatus.ACTIVE &&
      existing.status !== OrganizationMemberStatus.ACTIVE
    ) {
      if (
        existing.organization?.level === "UPAZILA" &&
        existing.category === GovernanceCategory.ADVISOR
      ) {
        throw new ApiError(
          httpStatus.CONFLICT,
          "Upazila organizations do not permit Advisor appointments.",
        );
      }
      const scope = `${existing.organizationId ?? "CENTRAL"}:${existing.category}`;
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${scope}))`;
      if (
        existing.organization?.level === "CENTRAL" &&
        existing.organizationId !== null &&
        existing.position.level === PositionLevel.EXECUTIVE &&
        existing.donor.role !== Role.ADMIN
      ) {
        await assertNationalAdminSeatReserved(
          existing.organizationId,
          existing.donorId,
          tx,
        );
      }
      await assertLeadershipCapacityAvailable(
        existing.organizationId,
        existing.category,
        existing.donorId,
        tx,
      );
    }

    const seatKey =
      status === OrganizationMemberStatus.ACTIVE &&
      (existing.position.level === PositionLevel.EXECUTIVE ||
        existing.position.level === PositionLevel.MANAGEMENT)
        ? governanceSeatKey(
            existing.organizationId,
            existing.category,
            existing.positionId,
          )
        : null;

    try {
      return await tx.organizationMember.update({
        where: { id: memberId },
        data: {
          status,
          seatKey,
          activatedAt:
            status === OrganizationMemberStatus.ACTIVE ? new Date() : undefined,
          endedAt:
            status === OrganizationMemberStatus.ACTIVE ? null : new Date(),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ApiError(
          httpStatus.CONFLICT,
          "This governance position already has an active occupant in the selected scope.",
        );
      }
      throw error;
    }
  });
};

const assignOrganizationMember = async (
  user: IJWTPayload,
  payload: {
    donorId: string;
    positionId: string;
    organizationId?: string;
    category?: GovernanceCategory;
  },
) => {
  const donor = await prisma.donor.findUnique({
    where: { id: payload.donorId, isDeleted: false },
  });
  if (!donor) throw new ApiError(httpStatus.NOT_FOUND, "Donor not found!");
  if (!donor.isVerified || donor.accountStatus !== AccountStatus.ACTIVE) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Committee and advisor appointments require an active, verified registered donor.",
    );
  }

  const appointingDonor = await getActiveActorDonor(user);
  let organizationId: string;

  if (user.role === Role.ADMIN) {
    // Omitting organizationId selects the seeded canonical Central scope.
    if (payload.organizationId) {
      organizationId = payload.organizationId;
    } else {
      const central = await prisma.organization.findFirst({
        where: { level: "CENTRAL", canonical: true, isDeleted: false },
        select: { id: true },
      });
      if (!central) {
        throw new ApiError(
          httpStatus.UNPROCESSABLE_ENTITY,
          "Canonical Central organization is missing. Run the platform seed before assigning National leadership.",
        );
      }
      organizationId = central.id;
    }
  } else {
    const managerMembership = await prisma.organizationMember.findFirst({
      where: {
        donorId: appointingDonor.id,
        status: OrganizationMemberStatus.ACTIVE,
        isDeleted: false,
      },
    });
    if (!managerMembership?.organizationId) {
      throw new ApiError(httpStatus.FORBIDDEN, "Organization context not found");
    }
    organizationId = managerMembership.organizationId;
    await assertCanAccessOrganizationDashboard(user, organizationId);
  }
  const existingMembership = await prisma.organizationMember.findFirst({
    where: { donorId: payload.donorId, isDeleted: false },
    include: {
      position: { select: { positionName: true, positionStatus: true } },
    },
  });
  if (
    existingMembership &&
    !isAutoDonorMembership(existingMembership) &&
    user.role !== Role.ADMIN
  ) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Only an Admin can move or reassign an existing governance member.",
    );
  }

  const position = await prisma.organizationPosition.findUnique({
    where: { id: payload.positionId, isDeleted: false },
  });
  if (!position) {
    throw new ApiError(httpStatus.NOT_FOUND, "Organization position not found!");
  }

  const derivedCategory =
    position.level === PositionLevel.MANAGEMENT
      ? GovernanceCategory.ADVISOR
      : GovernanceCategory.COMMITTEE;
  const category = payload.category ?? derivedCategory;
  if (category !== derivedCategory) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Governance category must match the selected position level.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.findUnique({
      where: { id: organizationId, isDeleted: false },
      select: { level: true },
    });
    if (!organization) {
      throw new ApiError(httpStatus.NOT_FOUND, "Organization not found!");
    }
    if (
      user.role !== Role.ADMIN &&
      organization?.level !== "UPAZILA"
    ) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Only an Admin can manage National, Division, and District governance assignments.",
      );
    }
    if (
      organization.level === "UPAZILA" &&
      category === GovernanceCategory.ADVISOR
    ) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "Upazila organizations do not permit Advisor appointments.",
      );
    }
    const scope = `${organizationId ?? "CENTRAL"}:${category}`;
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${scope}))`;

    if (
      organization.level === "CENTRAL" &&
      position.level === PositionLevel.EXECUTIVE &&
      donor.role !== Role.ADMIN
    ) {
      await assertNationalAdminSeatReserved(organizationId, payload.donorId, tx);
    }
    await assertLeadershipCapacityAvailable(
      organizationId,
      category,
      payload.donorId,
      tx,
    );

    const data = {
      organizationId,
      positionId: payload.positionId,
      category,
      seatKey: governanceSeatKey(organizationId, category, payload.positionId),
      appointedById: appointingDonor.id,
      status: OrganizationMemberStatus.ACTIVE,
      activatedAt: new Date(),
      endedAt: null,
      isDeleted: false,
      deletedAt: null,
    };

    try {
      return existingMembership
        ? await tx.organizationMember.update({
            where: { donorId: payload.donorId },
            data,
            include: {
              organization: true,
              donor: { omit: { password: true }, include: { bloodGroup: true } },
              position: true,
            },
          })
        : await tx.organizationMember.create({
            data: { ...data, donorId: payload.donorId },
            include: {
              organization: true,
              donor: { omit: { password: true }, include: { bloodGroup: true } },
              position: true,
            },
          });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ApiError(
          httpStatus.CONFLICT,
          "This governance position already has an active occupant in the selected scope.",
        );
      }
      throw error;
    }
  });
};

const leaveOrganization = async (user: IJWTPayload) => {
  const donor = await getActiveActorDonor(user);

  const membership = await prisma.organizationMember.findFirst({
    where: { donorId: donor.id, isDeleted: false },
  });

  if (!membership) {
    throw new ApiError(httpStatus.NOT_FOUND, "You are not a member of any organization!");
  }

  return prisma.organizationMember.update({
    where: { id: membership.id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      endedAt: new Date(),
      seatKey: null,
      status: OrganizationMemberStatus.REJECTED,
    },
  });
};

export const OrganizationMemberService = {
  joinOrganization,
  assignOrganizationMember,
  getMyMembership,
  getPublicLeadershipMembers,
  getPublicOrganizationMembers,
  getAllOrganizationMembers,
  getOrganizationMembers,
  updateMemberStatus,
  leaveOrganization,
};

