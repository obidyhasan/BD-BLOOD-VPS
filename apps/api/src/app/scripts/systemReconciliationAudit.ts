import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

type ReconciliationCheck = {
  check: string;
  count: number;
  severity: "ERROR" | "WARNING";
  remediation: string;
};

type ScalarCount = { count: bigint | number };

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run system reconciliation.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const countRows = async (query: TemplateStringsArray): Promise<number> => {
  const rows = await prisma.$queryRaw<ScalarCount[]>(query);
  return Number(rows[0]?.count ?? 0);
};

const checks = async (): Promise<ReconciliationCheck[]> => [
  {
    check: "request_status_assignment_aggregate_mismatches",
    count: await countRows`
      WITH aggregates AS (
        SELECT
          request.id,
          request.status,
          request."requiredUnits",
          COALESCE(SUM(assignment."bagUnits") FILTER (
            WHERE assignment.status IN ('ACCEPTED', 'DONATION_PENDING', 'DONATED')
              AND assignment."isDeleted" = false
          ), 0)::integer AS committed,
          COALESCE(SUM(assignment."bagUnits") FILTER (
            WHERE assignment.status = 'DONATED'
              AND assignment."isDeleted" = false
              AND donation."verificationStatus" = 'VERIFIED'
              AND donation."isDeleted" = false
          ), 0)::integer AS verified
        FROM "BloodRequests" request
        LEFT JOIN "requestAssignments" assignment ON assignment."requestId" = request.id
        LEFT JOIN "bloodDonations" donation ON donation."requestAssignmentId" = assignment.id
        WHERE request."isDeleted" = false
        GROUP BY request.id
      )
      SELECT COUNT(*)::bigint AS count
      FROM aggregates
      WHERE committed > "requiredUnits"
         OR verified > committed
         OR (status = 'DONOR_FOUND' AND committed < "requiredUnits")
         OR (status IN ('FULFILLED', 'COMPLETED') AND verified < "requiredUnits")
    `,
    severity: "ERROR",
    remediation: "Lock and repair each request from assignment and verified-donation aggregates; preserve status history.",
  },
  {
    check: "donor_cooldown_projection_mismatches",
    count: await countRows`
      WITH latest AS (
        SELECT "donorId", MAX("donationDate") AS "lastDonationDate"
        FROM "bloodDonations"
        WHERE "isDeleted" = false AND "verificationStatus" = 'VERIFIED'
        GROUP BY "donorId"
      )
      SELECT COUNT(*)::bigint AS count
      FROM "donors" donor
      LEFT JOIN latest ON latest."donorId" = donor.id
      WHERE donor."isDeleted" = false
        AND (
          donor."lastDonationDate" IS DISTINCT FROM latest."lastDonationDate"
          OR (latest."lastDonationDate" IS NULL AND donor."nextEligibleDonationDate" IS NOT NULL)
          OR (
            latest."lastDonationDate" IS NOT NULL
            AND donor."nextEligibleDonationDate" IS DISTINCT FROM latest."lastDonationDate" + INTERVAL '3 months'
          )
          OR (
            donor."nextEligibleDonationDate" > NOW()
            AND donor."availabilityStatus" <> 'UNAVAILABLE'
          )
          OR (
            (donor."nextEligibleDonationDate" IS NULL OR donor."nextEligibleDonationDate" <= NOW())
            AND donor."availabilityStatus" <> 'AVAILABLE'
          )
        )
    `,
    severity: "ERROR",
    remediation: "Recalculate last donation, next eligibility, and availability from verified donations.",
  },
  {
    check: "affiliation_geography_mismatches",
    count: await countRows`
      SELECT COUNT(*)::bigint AS count
      FROM "donor_organization_affiliations" affiliation
      INNER JOIN "donors" donor ON donor.id = affiliation."donorId"
      INNER JOIN "organizations" organization ON organization.id = affiliation."organizationId"
      WHERE affiliation.active = true
        AND (
          affiliation."upazilaId" IS DISTINCT FROM donor."upazilaId"
          OR affiliation."upazilaId" IS DISTINCT FROM organization."upazilaId"
          OR organization.level <> 'UPAZILA'
          OR organization.canonical = false
          OR organization."isDeleted" = true
        )
    `,
    severity: "ERROR",
    remediation: "Synchronize donor location to one active canonical Upazila affiliation without modifying governance memberships.",
  },
  {
    check: "governance_capacity_violations",
    count: await countRows`
      WITH occupied AS (
        SELECT
          organization.id,
          organization.level,
          membership.category,
          COUNT(*)::integer AS seats
        FROM "organizations" organization
        INNER JOIN "OrganizationMembers" membership
          ON membership."organizationId" = organization.id
        INNER JOIN "organizationPositions" position
          ON position.id = membership."positionId"
        WHERE organization."isDeleted" = false
          AND membership."isDeleted" = false
          AND membership.status = 'ACTIVE'
          AND position.level IN ('EXECUTIVE', 'MANAGEMENT')
        GROUP BY organization.id, organization.level, membership.category
      )
      SELECT COUNT(*)::bigint AS count
      FROM occupied
      WHERE seats > 11
         OR (level = 'UPAZILA' AND category = 'ADVISOR' AND seats > 0)
    `,
    severity: "ERROR",
    remediation: "End or remap reviewed excess seats; never silently delete governance records.",
  },
  {
    check: "achievement_unlock_mismatches",
    count: await countRows`
      WITH donor_counts AS (
        SELECT
          donor.id AS "donorId",
          COUNT(donation.id) FILTER (
            WHERE donation."verificationStatus" = 'VERIFIED'
              AND donation."isDeleted" = false
          )::integer AS verified,
          COUNT(donation.id) FILTER (
            WHERE donation."isDeleted" = false
          )::integer AS total
        FROM "donors" donor
        LEFT JOIN "bloodDonations" donation ON donation."donorId" = donor.id
        WHERE donor."isDeleted" = false
        GROUP BY donor.id
      ), expected AS (
        SELECT counts."donorId", achievement.id AS "achievementId"
        FROM donor_counts counts
        CROSS JOIN "achievements" achievement
        WHERE achievement.active = true
          AND achievement."isDeleted" = false
          AND (
            (achievement."thresholdType" = 'VERIFIED_DONATIONS' AND counts.verified >= achievement."thresholdValue")
            OR (achievement."thresholdType" = 'TOTAL_DONATIONS' AND counts.total >= achievement."thresholdValue")
          )
      )
      SELECT COUNT(*)::bigint AS count
      FROM (
        (SELECT "donorId", "achievementId" FROM expected
         EXCEPT
         SELECT "donorId", "achievementId" FROM "donor_achievements")
        UNION ALL
        (SELECT "donorId", "achievementId" FROM "donor_achievements"
         EXCEPT
         SELECT "donorId", "achievementId" FROM expected)
      ) mismatch
    `,
    severity: "WARNING",
    remediation: "Rebuild donor achievement unlocks from active database-driven thresholds.",
  },
];

const run = async (): Promise<void> => {
  try {
    const rows = await checks();
    const output = {
      generatedAt: new Date().toISOString(),
      database: new URL(connectionString).pathname.replace(/^\//, ""),
      healthy: rows.every((row) => row.count === 0),
      checks: rows,
    };
    console.table(
      rows.map((row) => ({
        check: row.check,
        count: row.count,
        severity: row.severity,
        result: row.count === 0 ? "PASS" : "DRIFT",
      })),
    );
    console.log(JSON.stringify(output, null, 2));
    if (!output.healthy) process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
};

void run().catch((error: unknown) => {
  console.error("System reconciliation audit failed.", error);
  process.exitCode = 1;
});
