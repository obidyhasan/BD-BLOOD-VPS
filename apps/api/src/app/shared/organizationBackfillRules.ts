import {
  GovernanceCategory,
  OrganizationLevel,
  OrganizationStatus,
  PositionLevel,
  VerificationStatus,
} from "@prisma/client";
import { GEO_ORGANIZATION_TYPES } from "./geoOrganizationTypes";

export const GOVERNANCE_CAPS: Record<
  OrganizationLevel,
  Record<GovernanceCategory, number>
> = {
  [OrganizationLevel.CENTRAL]: {
    [GovernanceCategory.COMMITTEE]: 11,
    [GovernanceCategory.ADVISOR]: 11,
  },
  [OrganizationLevel.DIVISION]: {
    [GovernanceCategory.COMMITTEE]: 11,
    [GovernanceCategory.ADVISOR]: 11,
  },
  [OrganizationLevel.DISTRICT]: {
    [GovernanceCategory.COMMITTEE]: 11,
    [GovernanceCategory.ADVISOR]: 11,
  },
  [OrganizationLevel.UPAZILA]: {
    [GovernanceCategory.COMMITTEE]: 11,
    [GovernanceCategory.ADVISOR]: 0,
  },
};

export const normalizeOrganizationLevel = (
  type?: string | null,
): OrganizationLevel => {
  const normalized = type?.trim().toLowerCase();

  if (
    normalized === GEO_ORGANIZATION_TYPES.division.toLowerCase() ||
    normalized?.includes("division")
  ) {
    return OrganizationLevel.DIVISION;
  }
  if (
    normalized === GEO_ORGANIZATION_TYPES.district.toLowerCase() ||
    normalized?.includes("district")
  ) {
    return OrganizationLevel.DISTRICT;
  }
  if (normalized?.includes("central") || normalized?.includes("national")) {
    return OrganizationLevel.CENTRAL;
  }
  return OrganizationLevel.UPAZILA;
};

export const governanceCategoryForPosition = (
  positionLevel: PositionLevel,
): GovernanceCategory | null => {
  if (positionLevel === PositionLevel.EXECUTIVE) {
    return GovernanceCategory.COMMITTEE;
  }
  if (positionLevel === PositionLevel.MANAGEMENT) {
    return GovernanceCategory.ADVISOR;
  }
  return null;
};

type CanonicalCandidate = {
  id: string;
  verificationStatus: VerificationStatus;
  organizationStatus: OrganizationStatus;
  createdAt: Date;
  isDeleted: boolean;
};

export const rankCanonicalCandidates = <T extends CanonicalCandidate>(
  candidates: T[],
): T[] =>
  candidates
    .filter(
      (candidate) =>
        !candidate.isDeleted &&
        candidate.verificationStatus === VerificationStatus.VERIFIED &&
        candidate.organizationStatus === OrganizationStatus.ACTIVE,
    )
    .sort(
      (left, right) =>
        left.createdAt.getTime() - right.createdAt.getTime() ||
        left.id.localeCompare(right.id),
    );

export const hasCanonicalCollision = (candidates: CanonicalCandidate[]) =>
  rankCanonicalCandidates(candidates).length > 1;

export const exceedsGovernanceCap = (
  level: OrganizationLevel,
  category: GovernanceCategory,
  activeCount: number,
) => activeCount > GOVERNANCE_CAPS[level][category];
