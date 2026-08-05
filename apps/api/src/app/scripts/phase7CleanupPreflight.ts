import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

type CleanupCheck = {
  check: string;
  count: number;
  blocks: string[];
  remediation: string;
};

type ScalarCount = { count: bigint | number };

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the Phase 7 cleanup preflight.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const countRows = async (query: TemplateStringsArray): Promise<number> => {
  const rows = await prisma.$queryRaw<ScalarCount[]>(query);
  return Number(rows[0]?.count ?? 0);
};

const checks = async (): Promise<CleanupCheck[]> => [
  {
    check: "normal_donor_memberships_without_active_affiliation",
    count: await countRows`
      SELECT COUNT(*)::bigint AS count
      FROM "OrganizationMembers" membership
      INNER JOIN "organizationPositions" position ON position.id = membership."positionId"
      LEFT JOIN "donor_organization_affiliations" affiliation
        ON affiliation."donorId" = membership."donorId"
       AND affiliation.active = true
      WHERE membership."isDeleted" = false
        AND membership.status = 'ACTIVE'
        AND LOWER(position."positionName") = 'normal donor'
        AND position.level = 'SUPPORT'
        AND affiliation.id IS NULL
    `,
    blocks: ["normal-donor-membership-removal", "affiliation-fallback-removal"],
    remediation: "Backfill an active DonorOrganizationAffiliation for every active legacy Normal Donor membership.",
  },
  {
    check: "active_affiliation_location_mismatches",
    count: await countRows`
      SELECT COUNT(*)::bigint AS count
      FROM "donor_organization_affiliations" affiliation
      INNER JOIN "donors" donor ON donor.id = affiliation."donorId"
      INNER JOIN "organizations" organization ON organization.id = affiliation."organizationId"
      WHERE affiliation.active = true
        AND (
          donor."upazilaId" IS DISTINCT FROM affiliation."upazilaId"
          OR organization."upazilaId" IS DISTINCT FROM affiliation."upazilaId"
          OR organization.level <> 'UPAZILA'
          OR organization.canonical = false
          OR organization."isDeleted" = true
        )
    `,
    blocks: ["affiliation-fallback-removal", "organization-legacy-field-removal"],
    remediation: "Reconcile donor Upazila, affiliation Upazila, and the active canonical Upazila organization.",
  },
  {
    check: "active_governance_memberships_without_organization",
    count: await countRows`
      SELECT COUNT(*)::bigint AS count
      FROM "OrganizationMembers" membership
      INNER JOIN "organizationPositions" position ON position.id = membership."positionId"
      WHERE membership."isDeleted" = false
        AND membership.status = 'ACTIVE'
        AND position.level IN ('EXECUTIVE', 'MANAGEMENT')
        AND membership."organizationId" IS NULL
    `,
    blocks: ["governance-organization-required"],
    remediation: "Assign Central governance rows to the real canonical Central organization.",
  },
  {
    check: "legacy_pending_blood_requests",
    count: await countRows`
      SELECT COUNT(*)::bigint AS count
      FROM "BloodRequests"
      WHERE "isDeleted" = false
        AND status = 'PENDING'
    `,
    blocks: ["legacy-request-status-removal"],
    remediation: "Run and verify the request lifecycle backfill until no blood request remains PENDING.",
  },
  {
    check: "legacy_pending_or_rejected_assignments",
    count: await countRows`
      SELECT COUNT(*)::bigint AS count
      FROM "requestAssignments"
      WHERE "isDeleted" = false
        AND status IN ('PENDING', 'REJECTED')
    `,
    blocks: ["legacy-assignment-status-removal"],
    remediation: "Normalize PENDING to NOTIFIED and REJECTED to DECLINED, then reconcile actionable notifications.",
  },
  {
    check: "active_canonical_organizations_using_legacy_type",
    count: await countRows`
      SELECT COUNT(*)::bigint AS count
      FROM "organizations"
      WHERE "isDeleted" = false
        AND canonical = true
        AND type IS NOT NULL
        AND BTRIM(type) <> ''
    `,
    blocks: ["organization-type-removal"],
    remediation: "Verify all readers use Organization.level, then clear legacy type values before dropping the column.",
  },
  {
    check: "blood_requests_missing_authoritative_handler",
    count: await countRows`
      SELECT COUNT(*)::bigint AS count
      FROM "BloodRequests"
      WHERE "isDeleted" = false
        AND "handledByOrganizationId" IS NULL
    `,
    blocks: ["legacy-request-organization-removal"],
    remediation: "Backfill every request to one authoritative handling organization and verify jurisdiction.",
  },
];

const run = async (): Promise<void> => {
  try {
    const rows = await checks();
    const blockers = rows.filter((row) => row.count > 0);
    const output = {
      generatedAt: new Date().toISOString(),
      database: new URL(connectionString).pathname.replace(/^\//, ""),
      readyForDestructiveCleanup: blockers.length === 0,
      checks: rows,
      blockedCapabilities: [...new Set(blockers.flatMap((row) => row.blocks))].sort(),
    };

    console.table(
      rows.map((row) => ({
        check: row.check,
        count: row.count,
        result: row.count === 0 ? "PASS" : "BLOCKED",
      })),
    );
    console.log(JSON.stringify(output, null, 2));

    if (blockers.length > 0) {
      process.exitCode = 2;
    }
  } finally {
    await prisma.$disconnect();
  }
};

void run().catch((error: unknown) => {
  console.error("Phase 7 cleanup preflight failed.", error);
  process.exitCode = 1;
});
