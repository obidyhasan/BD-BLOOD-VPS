import assert from "node:assert/strict";
import test from "node:test";
import { DonorProfileStatus } from "@prisma/client";
import {
  calculateDonorCapabilities,
  calculateProfileReadiness,
  getMissingProfileFields,
} from "../src/app/shared/profileReadiness";

const completeFacts = {
  fullName: "A Donor",
  phone: "01700000000",
  emailVerified: true,
  bloodGroupId: "blood-a",
  divisionId: "division-1",
  districtId: "district-1",
  upazilaId: "upazila-1",
  geographyValid: true,
  affiliationActive: true,
  accountActive: true,
  availabilityAvailable: true,
  nextEligibleDonationDate: null,
};

test("profile readiness reports missing verification, geography, and affiliation", () => {
  const missing = getMissingProfileFields({
    ...completeFacts,
    emailVerified: false,
    geographyValid: false,
    affiliationActive: false,
  });

  assert.deepEqual(missing, ["emailVerified", "geographicAncestry", "affiliation"]);
});

test("complete profile receives a completion status and timestamp", () => {
  const now = new Date("2026-08-04T00:00:00Z");
  const readiness = calculateProfileReadiness(completeFacts, now);

  assert.equal(readiness.status, DonorProfileStatus.COMPLETE);
  assert.equal(readiness.completedAt, now);
  assert.deepEqual(readiness.missingFields, []);
});

test("cooldown blocks request acceptance but does not invalidate profile completion", () => {
  const now = new Date("2026-08-04T00:00:00Z");
  const facts = {
    ...completeFacts,
    nextEligibleDonationDate: new Date("2026-09-04T00:00:00Z"),
  };
  const readiness = calculateProfileReadiness(facts, now);
  const capabilities = calculateDonorCapabilities(facts, readiness, now);

  assert.equal(readiness.status, DonorProfileStatus.COMPLETE);
  assert.equal(capabilities.canAcceptBloodRequests, false);
  assert.equal(capabilities.canSubmitDonation, true);
  assert.equal(capabilities.nextEligibleDonationAt?.toISOString(), "2026-09-04T00:00:00.000Z");
});

test("incomplete profile cannot accept or submit donation", () => {
  const facts = { ...completeFacts, affiliationActive: false };
  const readiness = calculateProfileReadiness(facts);
  const capabilities = calculateDonorCapabilities(facts, readiness);

  assert.equal(readiness.status, DonorProfileStatus.INCOMPLETE);
  assert.equal(capabilities.canAcceptBloodRequests, false);
  assert.equal(capabilities.canSubmitDonation, false);
});
