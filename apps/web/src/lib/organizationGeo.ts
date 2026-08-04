export const GEO_ORGANIZATION_TYPES = {
  division: "Division Organization",
  district: "District Organization",
  upazila: "Upazila Organization",
} as const;

export type GeoOrganizationType =
  (typeof GEO_ORGANIZATION_TYPES)[keyof typeof GEO_ORGANIZATION_TYPES];

export type LocationOrgQueryInput = {
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  limit?: number;
};

export function isGeoOrganization(type?: string | null): type is GeoOrganizationType {
  return (
    type === GEO_ORGANIZATION_TYPES.division ||
    type === GEO_ORGANIZATION_TYPES.district ||
    type === GEO_ORGANIZATION_TYPES.upazila
  );
}

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
      type: GEO_ORGANIZATION_TYPES.upazila,
      limit: limit ?? 1,
    };
  }

  if (districtId) {
    return {
      ...base,
      districtId,
      type: GEO_ORGANIZATION_TYPES.district,
      limit: limit ?? 1,
    };
  }

  if (divisionId) {
    return {
      ...base,
      divisionId,
      type: GEO_ORGANIZATION_TYPES.division,
      limit: limit ?? 1,
    };
  }

  return {
    ...base,
    type: GEO_ORGANIZATION_TYPES.division,
    limit: limit ?? 8,
  };
}
