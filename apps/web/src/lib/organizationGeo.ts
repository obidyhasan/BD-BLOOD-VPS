export type LocationOrgQueryInput = {
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  limit?: number;
};

/** Build API params for the location org at the most specific selected level. */
export function buildLocationOrgQueryParams({
  divisionId = "",
  districtId = "",
  upazilaId = "",
  limit,
}: LocationOrgQueryInput = {}) {
  const base = {
    verificationStatus: "VERIFIED",
    organizationStatus: "ACTIVE",
  } as const;

  if (upazilaId) {
    return {
      ...base,
      upazilaId,
      level: "UPAZILA" as const,
      limit: limit ?? 1,
    };
  }

  if (districtId) {
    return {
      ...base,
      districtId,
      level: "DISTRICT" as const,
      limit: limit ?? 1,
    };
  }

  if (divisionId) {
    return {
      ...base,
      divisionId,
      level: "DIVISION" as const,
      limit: limit ?? 1,
    };
  }

  return {
    ...base,
    level: "DIVISION" as const,
    limit: limit ?? 8,
  };
}
