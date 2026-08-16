import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

type AuditRow = {
  check: string;
  count: number;
  severity: "BLOCKER" | "WARNING" | "INFO";
  remediation: string;
};

type ScalarCount = { count: bigint | number };

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the migration anomaly audit.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const countRows = async (query: TemplateStringsArray): Promise<number> => {
  const rows = await prisma.$queryRaw<ScalarCount[]>(query);
  return Number(rows[0]?.count ?? 0);
};

const checks = async (): Promise<AuditRow[]> => [
  {
    check: "organizations_missing_geography",
    count: await countRows`
      SELECT COUNT(*)::bigint AS count
      FROM "organizations"
      WHERE "isDeleted" = false
        AND ("divisionId" IS NULL OR "districtId" IS NULL OR "upazilaId" IS NULL)
    `,
    severity: "BLOCKER",
    remediation: "Repair invalid legacy organizations before hierarchy backfill.",
  },
  {
    check: "duplicate_active_organizations_per_upazila",
    count: await countRows`
      SELECT COUNT(*)::bigint AS count
      FROM (
        SELECT "upazilaId"
        FROM "organizations"
        WHERE "isDeleted" = false
          AND "level" = 'UPAZILA'
        GROUP BY "upazilaId"
        HAVING COUNT(*) > 1
      ) duplicates
    `,
    severity: "WARNING",
    remediation: "Choose one canonical Upazila organization for every duplicate scope.",
  },
  {
    check: "invalid_organization_geo_ancestry",
    count: await countRows`
      SELECT COUNT(*)::bigint AS count
      FROM "organizations" organization
      LEFT JOIN "districts" district ON district.id = organization."districtId"
      LEFT JOIN "upazilas" upazila ON upazila.id = organization."upazilaId"
      WHERE organization."isDeleted" = false
        AND (
          district.id IS NULL
          OR upazila.id IS NULL
          OR district."divisionId" <> organization."divisionId"
          OR upazila."districtId" <> organization."districtId"
        )
    `,
    severity: "BLOCKER",
    remediation: "Correct organization Division/District/Upazila relationships before cutover.",
  },
  {
    check: "normal_donor_memberships",
    count: await countRows`
      SELECT COUNT(*)::bigint AS count
      FROM "OrganizationMembers" membership
      INNER JOIN "organizationPositions" position ON position.id = membership."positionId"
      WHERE membership."isDeleted" = false
        AND membership.status = 'ACTIVE'
        AND LOWER(position."positionName") = 'normal donor'
    `,
    severity: "INFO",
    remediation: "Backfill these rows into DonorOrganizationAffiliation; retain memberships until cutover.",
  },
  {
    check: "active_memberships_without_organization",
    count: await countRows`
      SELECT COUNT(*)::bigint AS count
      FROM "OrganizationMembers"
      WHERE "isDeleted" = false
        AND status = 'ACTIVE'
        AND "organizationId" IS NULL
    `,
    severity: "WARNING",
    remediation: "Map national memberships to the new real Central organization.",
  },
  {
    check: "donors_with_invalid_geo_ancestry",
    count: await countRows`
      SELECT COUNT(*)::bigint AS count
      FROM "donors" donor
      LEFT JOIN "districts" district ON district.id = donor."districtId"
      LEFT JOIN "upazilas" upazila ON upazila.id = donor."upazilaId"
      WHERE donor."isDeleted" = false
        AND donor."upazilaId" IS NOT NULL
        AND (
          district.id IS NULL
          OR upazila.id IS NULL
          OR district."divisionId" <> donor."divisionId"
          OR upazila."districtId" <> donor."districtId"
        )
    `,
    severity: "WARNING",
    remediation: "Repair donor locations or leave affected profiles incomplete during backfill.",
  },
  {
    check: "requests_with_non_positive_required_units",
    count: await countRows`
      SELECT COUNT(*)::bigint AS count
      FROM "BloodRequests"
      WHERE "isDeleted" = false
        AND "requiredUnits" <= 0
    `,
    severity: "BLOCKER",
    remediation: "Correct requiredUnits before validating the positive-bag database constraint.",
  },
  {
    check: "fulfilled_requests_without_verified_linked_donations",
    count: await countRows`
      SELECT COUNT(*)::bigint AS count
      FROM "BloodRequests" request
      WHERE request."isDeleted" = false
        AND request.status = 'FULFILLED'
        AND NOT EXISTS (
          SELECT 1
          FROM "requestAssignments" assignment
          INNER JOIN "bloodDonations" donation
            ON donation."requestAssignmentId" = assignment.id
          WHERE assignment."requestId" = request.id
            AND donation."isDeleted" = false
            AND donation."verificationStatus" = 'VERIFIED'
        )
    `,
    severity: "WARNING",
    remediation: "Review legacy fulfillment records before enabling verified-donation state transitions.",
  },
  {
    check: "duplicate_donations_per_assignment",
    count: await countRows`
      SELECT COUNT(*)::bigint AS count
      FROM (
        SELECT "requestAssignmentId"
        FROM "bloodDonations"
        WHERE "isDeleted" = false
          AND "requestAssignmentId" IS NOT NULL
        GROUP BY "requestAssignmentId"
        HAVING COUNT(*) > 1
      ) duplicates
    `,
    severity: "BLOCKER",
    remediation: "Select or merge a single donation before applying the unique assignment-donation index.",
  },
];

const run = async (): Promise<void> => {
  try {
    const rows = await checks();
    const output = {
      generatedAt: new Date().toISOString(),
      database: new URL(connectionString).pathname.replace(/^\//, ""),
      checks: rows,
      totals: {
        blockers: rows.filter((row) => row.severity === "BLOCKER" && row.count > 0).length,
        warnings: rows.filter((row) => row.severity === "WARNING" && row.count > 0).length,
      },
    };

    console.table(rows);
    console.log(JSON.stringify(output, null, 2));

    if (output.totals.blockers > 0) {
      process.exitCode = 2;
    }
  } finally {
    await prisma.$disconnect();
  }
};

void run().catch((error: unknown) => {
  console.error("Migration anomaly audit failed.", error);
  process.exitCode = 1;
});
