import { DonorProfileStatus } from "@prisma/client";

export type ProfileFacts = {
  fullName?: string | null;
  phone?: string | null;
  emailVerified: boolean;
  bloodGroupId?: string | null;
  divisionId?: string | null;
  districtId?: string | null;
  upazilaId?: string | null;
  geographyValid: boolean;
  affiliationActive: boolean;
  accountActive: boolean;
  availabilityAvailable: boolean;
  nextEligibleDonationDate?: Date | null;
};

export type ProfileReadiness = {
  status: DonorProfileStatus;
  completedAt: Date | null;
  missingFields: string[];
};

export type DonorCapabilities = {
  canAcceptBloodRequests: boolean;
  canSubmitDonation: boolean;
  canCreateDonationPost: boolean;
  canAccessOrganizationDashboard: boolean;
  nextEligibleDonationAt: Date | null;
};

export const getMissingProfileFields = (facts: ProfileFacts): string[] => {
  const missing: string[] = [];

  if (!facts.fullName?.trim()) missing.push("fullName");
  if (!facts.phone?.trim()) missing.push("phone");
  if (!facts.emailVerified) missing.push("emailVerified");
  if (!facts.bloodGroupId) missing.push("bloodGroupId");
  if (!facts.divisionId) missing.push("divisionId");
  if (!facts.districtId) missing.push("districtId");
  if (!facts.upazilaId) missing.push("upazilaId");
  if (
    facts.divisionId &&
    facts.districtId &&
    facts.upazilaId &&
    !facts.geographyValid
  ) {
    missing.push("geographicAncestry");
  }
  if (!facts.affiliationActive) missing.push("affiliation");

  return missing;
};

export const calculateProfileReadiness = (
  facts: ProfileFacts,
  now = new Date(),
): ProfileReadiness => {
  const missingFields = getMissingProfileFields(facts);
  const complete = missingFields.length === 0;

  return {
    status: complete ? DonorProfileStatus.COMPLETE : DonorProfileStatus.INCOMPLETE,
    completedAt: complete ? now : null,
    missingFields,
  };
};

export const calculateDonorCapabilities = (
  facts: ProfileFacts,
  readiness: ProfileReadiness,
  now = new Date(),
): DonorCapabilities => {
  const cooldownActive = Boolean(
    facts.nextEligibleDonationDate && facts.nextEligibleDonationDate > now,
  );
  const operationallyReady =
    readiness.status === DonorProfileStatus.COMPLETE &&
    facts.emailVerified &&
    facts.accountActive;

  return {
    canAcceptBloodRequests:
      operationallyReady && facts.availabilityAvailable && !cooldownActive,
    canSubmitDonation: operationallyReady,
    canCreateDonationPost: operationallyReady,
    canAccessOrganizationDashboard: false,
    nextEligibleDonationAt: facts.nextEligibleDonationDate ?? null,
  };
};
