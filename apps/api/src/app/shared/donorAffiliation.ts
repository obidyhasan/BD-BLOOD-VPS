import {
  AffiliationSource,
  OrganizationLevel,
  Prisma,
} from "@prisma/client";
import { GEO_ORGANIZATION_TYPES } from "./geoOrganizationTypes";

export type AffiliationClient = Pick<
  Prisma.TransactionClient,
  "organization" | "organizationMember" | "donorOrganizationAffiliation"
>;

export type ResolvedDonorAffiliation = {
  organizationId: string;
  upazilaId: string;
  source: AffiliationSource | "LEGACY_MEMBERSHIP";
};

export const resolveUpazilaOrganization = async (
  db: AffiliationClient,
  upazilaId: string,
) => {
  const canonical = await db.organization.findFirst({
    where: {
      upazilaId,
      level: OrganizationLevel.UPAZILA,
      canonical: true,
      isDeleted: false,
    },
    orderBy: [{ verificationStatus: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, upazilaId: true },
  });

  if (canonical) return canonical;

  return db.organization.findFirst({
    where: {
      upazilaId,
      type: GEO_ORGANIZATION_TYPES.upazila,
      isDeleted: false,
    },
    orderBy: [{ verificationStatus: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, upazilaId: true },
  });
};

export const resolveDonorAffiliation = async (
  db: AffiliationClient,
  donorId: string,
): Promise<ResolvedDonorAffiliation | null> => {
  const affiliation = await db.donorOrganizationAffiliation.findUnique({
    where: { donorId },
    select: {
      organizationId: true,
      upazilaId: true,
      source: true,
      active: true,
    },
  });

  if (affiliation?.active) {
    return {
      organizationId: affiliation.organizationId,
      upazilaId: affiliation.upazilaId,
      source: affiliation.source,
    };
  }

  const legacyMembership = await db.organizationMember.findFirst({
    where: {
      donorId,
      isDeleted: false,
      status: "ACTIVE",
      organizationId: { not: null },
      position: {
        positionName: "Normal Donor",
        level: "SUPPORT",
        positionStatus: "GENERAL",
      },
    },
    select: {
      organizationId: true,
      organization: { select: { upazilaId: true } },
    },
  });

  if (!legacyMembership?.organizationId || !legacyMembership.organization) {
    return null;
  }

  return {
    organizationId: legacyMembership.organizationId,
    upazilaId: legacyMembership.organization.upazilaId,
    source: "LEGACY_MEMBERSHIP",
  };
};

export const upsertDonorAffiliation = async (
  db: AffiliationClient,
  data: {
    donorId: string;
    organizationId: string;
    upazilaId: string;
    source: AffiliationSource;
  },
) =>
  db.donorOrganizationAffiliation.upsert({
    where: { donorId: data.donorId },
    create: {
      donorId: data.donorId,
      organizationId: data.organizationId,
      upazilaId: data.upazilaId,
      source: data.source,
      active: true,
    },
    update: {
      organizationId: data.organizationId,
      upazilaId: data.upazilaId,
      source: data.source,
      active: true,
      assignedAt: new Date(),
    },
    include: { organization: true },
  });
