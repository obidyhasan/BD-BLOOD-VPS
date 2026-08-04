/**
 * `Organization.type` is a free-form string (see schema comment on
 * `Organization.type`), but the geo-seed (see `seed/organizationSeed.ts`)
 * writes one of these three fixed values to flag an Organization as the
 * canonical Division/District/Upazila coordination org for that geo entity.
 *
 * These are the single source of truth for those values — import this
 * instead of re-declaring the strings so seed, sync, and query code can't
 * drift apart.
 */
export const GEO_ORGANIZATION_TYPES = {
  division: "Division Organization",
  district: "District Organization",
  upazila: "Upazila Organization",
} as const;

export type GeoOrganizationType =
  (typeof GEO_ORGANIZATION_TYPES)[keyof typeof GEO_ORGANIZATION_TYPES];
