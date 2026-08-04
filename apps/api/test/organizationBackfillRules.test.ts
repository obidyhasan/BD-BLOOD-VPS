import assert from "node:assert/strict";
import test from "node:test";
import {
  GovernanceCategory,
  OrganizationLevel,
  OrganizationStatus,
  PositionLevel,
  VerificationStatus,
} from "@prisma/client";
import {
  exceedsGovernanceCap,
  governanceCategoryForPosition,
  hasCanonicalCollision,
  normalizeOrganizationLevel,
  rankCanonicalCandidates,
} from "../src/app/shared/organizationBackfillRules";

test("normalizes legacy organization types conservatively", () => {
  assert.equal(
    normalizeOrganizationLevel("Division Organization"),
    OrganizationLevel.DIVISION,
  );
  assert.equal(
    normalizeOrganizationLevel("District Coordination Unit"),
    OrganizationLevel.DISTRICT,
  );
  assert.equal(
    normalizeOrganizationLevel("National Committee"),
    OrganizationLevel.CENTRAL,
  );
  assert.equal(
    normalizeOrganizationLevel("Regional Branch"),
    OrganizationLevel.UPAZILA,
  );
  assert.equal(normalizeOrganizationLevel(null), OrganizationLevel.UPAZILA);
});

test("canonical ranking accepts only verified active rows and is deterministic", () => {
  const candidates = [
    {
      id: "later",
      verificationStatus: VerificationStatus.VERIFIED,
      organizationStatus: OrganizationStatus.ACTIVE,
      createdAt: new Date("2025-01-02T00:00:00Z"),
      isDeleted: false,
    },
    {
      id: "earlier",
      verificationStatus: VerificationStatus.VERIFIED,
      organizationStatus: OrganizationStatus.ACTIVE,
      createdAt: new Date("2025-01-01T00:00:00Z"),
      isDeleted: false,
    },
    {
      id: "pending",
      verificationStatus: VerificationStatus.PENDING,
      organizationStatus: OrganizationStatus.ACTIVE,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      isDeleted: false,
    },
  ];

  assert.deepEqual(
    rankCanonicalCandidates(candidates).map((candidate) => candidate.id),
    ["earlier", "later"],
  );
  assert.equal(hasCanonicalCollision(candidates), true);
  assert.equal(hasCanonicalCollision([candidates[2]]), false);
});

test("maps governance positions without treating support as governance", () => {
  assert.equal(
    governanceCategoryForPosition(PositionLevel.EXECUTIVE),
    GovernanceCategory.COMMITTEE,
  );
  assert.equal(
    governanceCategoryForPosition(PositionLevel.MANAGEMENT),
    GovernanceCategory.ADVISOR,
  );
  assert.equal(governanceCategoryForPosition(PositionLevel.SUPPORT), null);
});

test("enforces approved governance caps including no Upazila advisors", () => {
  assert.equal(
    exceedsGovernanceCap(
      OrganizationLevel.DIVISION,
      GovernanceCategory.COMMITTEE,
      11,
    ),
    false,
  );
  assert.equal(
    exceedsGovernanceCap(
      OrganizationLevel.DIVISION,
      GovernanceCategory.COMMITTEE,
      12,
    ),
    true,
  );
  assert.equal(
    exceedsGovernanceCap(
      OrganizationLevel.UPAZILA,
      GovernanceCategory.ADVISOR,
      1,
    ),
    true,
  );
});
