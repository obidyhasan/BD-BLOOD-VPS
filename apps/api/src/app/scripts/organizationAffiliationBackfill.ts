import {
  AffiliationSource,
  GovernanceCategory,
  OrganizationLevel,
  OrganizationMemberStatus,
  PositionLevel,
} from "@prisma/client";
import { prisma } from "../shared/prisma";
import {
  GOVERNANCE_CAPS,
  governanceCategoryForPosition,
  normalizeOrganizationLevel,
  rankCanonicalCandidates,
} from "../shared/organizationBackfillRules";

const APPLY_FLAG = "--apply";
const apply = process.argv.includes(APPLY_FLAG);

type OrganizationRow = Awaited<ReturnType<typeof loadOrganizations>>[number];
type ReviewItem = {
  code: string;
  severity: "BLOCKER" | "REVIEW";
  scope?: string;
  organizationIds?: string[];
  memberIds?: string[];
  detail: string;
};

const loadOrganizations = () =>
  prisma.organization.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      name: true,
      type: true,
      level: true,
      canonical: true,
      parentId: true,
      divisionId: true,
      districtId: true,
      upazilaId: true,
      verificationStatus: true,
      organizationStatus: true,
      createdAt: true,
      isDeleted: true,
    },
  });

const scopeKey = (organization: OrganizationRow, level: OrganizationLevel) => {
  if (level === OrganizationLevel.CENTRAL) return "CENTRAL";
  if (level === OrganizationLevel.DIVISION) return `DIVISION:${organization.divisionId}`;
  if (level === OrganizationLevel.DISTRICT) return `DISTRICT:${organization.districtId}`;
  return `UPAZILA:${organization.upazilaId}`;
};

const main = async () => {
  const [organizations, memberships, donors] = await Promise.all([
    loadOrganizations(),
    prisma.organizationMember.findMany({
      where: {
        isDeleted: false,
        status: OrganizationMemberStatus.ACTIVE,
      },
      select: {
        id: true,
        donorId: true,
        organizationId: true,
        category: true,
        position: {
          select: {
            positionName: true,
            positionStatus: true,
            level: true,
          },
        },
      },
    }),
    prisma.donor.findMany({
      where: { isDeleted: false, upazilaId: { not: null } },
      select: { id: true, upazilaId: true },
    }),
  ]);

  const review: ReviewItem[] = [];
  const normalizedLevels = new Map<string, OrganizationLevel>();
  const candidatesByScope = new Map<string, OrganizationRow[]>();

  for (const organization of organizations) {
    const level = organization.type
      ? normalizeOrganizationLevel(organization.type)
      : organization.level;
    normalizedLevels.set(organization.id, level);
    const key = scopeKey(organization, level);
    const candidates = candidatesByScope.get(key) ?? [];
    candidates.push(organization);
    candidatesByScope.set(key, candidates);
  }

  const canonicalByScope = new Map<string, OrganizationRow>();
  for (const [scope, candidates] of candidatesByScope) {
    const eligible = rankCanonicalCandidates(candidates);
    if (eligible.length === 1) {
      canonicalByScope.set(scope, eligible[0]);
    } else if (eligible.length > 1) {
      review.push({
        code: "CANONICAL_COLLISION",
        severity: "BLOCKER",
        scope,
        organizationIds: eligible.map((candidate) => candidate.id),
        detail: "Multiple verified active organizations are eligible; Admin selection is required.",
      });
    }
  }

  if (!canonicalByScope.has("CENTRAL")) {
    review.push({
      code: "CENTRAL_ORGANIZATION_MISSING",
      severity: "REVIEW",
      scope: "CENTRAL",
      detail:
        "No unambiguous verified active Central organization exists. Create one after geographic organization columns become nullable.",
    });
  }

  const canonicalUpazilas = new Map<string, OrganizationRow>();
  for (const [scope, organization] of canonicalByScope) {
    if (scope.startsWith("UPAZILA:")) {
      canonicalUpazilas.set(scope.slice("UPAZILA:".length), organization);
    }
  }

  const affiliationPlans = new Map<
    string,
    { donorId: string; organizationId: string; upazilaId: string; source: AffiliationSource }
  >();

  for (const membership of memberships) {
    const isNormalDonor =
      membership.position.positionName === "Normal Donor" &&
      membership.position.level === PositionLevel.SUPPORT;
    if (!isNormalDonor || !membership.organizationId) continue;

    const organization = organizations.find(
      (item) => item.id === membership.organizationId,
    );
    if (!organization) continue;

    const canonicalOrganization = canonicalUpazilas.get(organization.upazilaId);
    if (!canonicalOrganization) {
      review.push({
        code: "LEGACY_AFFILIATION_UNRESOLVED",
        severity: "REVIEW",
        scope: `UPAZILA:${organization.upazilaId}`,
        organizationIds: [organization.id],
        memberIds: [membership.id],
        detail:
          "Normal Donor membership has no unambiguous canonical Upazila organization.",
      });
      continue;
    }

    affiliationPlans.set(membership.donorId, {
      donorId: membership.donorId,
      organizationId: canonicalOrganization.id,
      upazilaId: canonicalOrganization.upazilaId,
      source: AffiliationSource.MIGRATION,
    });
  }

  for (const donor of donors) {
    if (!donor.upazilaId || affiliationPlans.has(donor.id)) continue;
    const organization = canonicalUpazilas.get(donor.upazilaId);
    if (!organization) {
      review.push({
        code: "DONOR_AFFILIATION_UNRESOLVED",
        severity: "REVIEW",
        scope: `UPAZILA:${donor.upazilaId}`,
        detail: `Donor ${donor.id} has no unambiguous canonical Upazila organization.`,
      });
      continue;
    }
    affiliationPlans.set(donor.id, {
      donorId: donor.id,
      organizationId: organization.id,
      upazilaId: donor.upazilaId,
      source: AffiliationSource.MIGRATION,
    });
  }

  const governanceUpdates: Array<{
    memberId: string;
    category: GovernanceCategory;
  }> = [];
  const governanceCounts = new Map<string, string[]>();

  for (const membership of memberships) {
    const category = governanceCategoryForPosition(membership.position.level);
    if (!category || !membership.organizationId) continue;
    const organization = organizations.find(
      (item) => item.id === membership.organizationId,
    );
    if (!organization) continue;
    const level = normalizedLevels.get(organization.id) ?? OrganizationLevel.UPAZILA;

    if (
      level === OrganizationLevel.UPAZILA &&
      category === GovernanceCategory.ADVISOR
    ) {
      review.push({
        code: "UPAZILA_ADVISOR_REQUIRES_REMAP",
        severity: "REVIEW",
        scope: `UPAZILA:${organization.upazilaId}`,
        memberIds: [membership.id],
        detail: "Upazila MANAGEMENT membership must be explicitly remapped or ended.",
      });
      continue;
    }

    governanceUpdates.push({ memberId: membership.id, category });
    const countKey = `${organization.id}:${category}`;
    const memberIds = governanceCounts.get(countKey) ?? [];
    memberIds.push(membership.id);
    governanceCounts.set(countKey, memberIds);
  }

  for (const [key, memberIds] of governanceCounts) {
    const separator = key.lastIndexOf(":");
    const organizationId = key.slice(0, separator);
    const category = key.slice(separator + 1) as GovernanceCategory;
    const organization = organizations.find((item) => item.id === organizationId);
    if (!organization) continue;
    const level = normalizedLevels.get(organization.id) ?? OrganizationLevel.UPAZILA;
    const cap = GOVERNANCE_CAPS[level][category];
    if (memberIds.length > cap) {
      review.push({
        code: "GOVERNANCE_CAP_EXCEEDED",
        severity: "REVIEW",
        organizationIds: [organizationId],
        memberIds,
        detail: `${memberIds.length} active ${category} appointments exceed the ${cap}-seat ${level} cap.`,
      });
    }
  }

  const blockers = review.filter((item) => item.severity === "BLOCKER");

  if (apply && blockers.length > 0) {
    console.error(
      `Apply refused: resolve ${blockers.length} blocker(s) reported by the dry run first.`,
    );
    process.exitCode = 2;
  } else if (apply) {
    await prisma.$transaction(async (tx) => {
      for (const organization of organizations) {
        await tx.organization.update({
          where: { id: organization.id },
          data: {
            level: normalizedLevels.get(organization.id),
            canonical: false,
          },
        });
      }

      for (const [scope, organization] of canonicalByScope) {
        const level = normalizedLevels.get(organization.id)!;
        let parentId: string | null = null;
        if (level === OrganizationLevel.DIVISION) {
          parentId = canonicalByScope.get("CENTRAL")?.id ?? null;
        } else if (level === OrganizationLevel.DISTRICT) {
          parentId = canonicalByScope.get(`DIVISION:${organization.divisionId}`)?.id ?? null;
        } else if (level === OrganizationLevel.UPAZILA) {
          parentId = canonicalByScope.get(`DISTRICT:${organization.districtId}`)?.id ?? null;
        }
        await tx.organization.update({
          where: { id: organization.id },
          data: { canonical: true, parentId },
        });
        void scope;
      }

      for (const affiliation of affiliationPlans.values()) {
        await tx.donorOrganizationAffiliation.upsert({
          where: { donorId: affiliation.donorId },
          create: { ...affiliation, active: true },
          update: {
            organizationId: affiliation.organizationId,
            upazilaId: affiliation.upazilaId,
            source: affiliation.source,
            active: true,
          },
        });
      }

      for (const update of governanceUpdates) {
        await tx.organizationMember.update({
          where: { id: update.memberId },
          data: { category: update.category },
        });
      }
    });
  }

  const output = {
    mode: apply ? "APPLY" : "DRY_RUN",
    summary: {
      organizationsScanned: organizations.length,
      canonicalOrganizationsPlanned: canonicalByScope.size,
      affiliationsPlanned: affiliationPlans.size,
      governanceMappingsPlanned: governanceUpdates.length,
      blockers: blockers.length,
      reviewItems: review.filter((item) => item.severity === "REVIEW").length,
    },
    canonicalOrganizations: [...canonicalByScope].map(([scope, organization]) => ({
      scope,
      id: organization.id,
      name: organization.name,
    })),
    review,
  };

  console.log(JSON.stringify(output, null, 2));
  if (!apply) {
    console.error(`Dry run only. Re-run with ${APPLY_FLAG} after reviewing the report.`);
  }
  if (review.some((item) => item.severity === "BLOCKER")) {
    process.exitCode = 2;
  }
};

main()
  .catch((error) => {
    console.error("Phase 2 organization/affiliation backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
