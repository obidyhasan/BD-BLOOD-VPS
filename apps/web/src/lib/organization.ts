import type { Organization } from "@/redux/features/organizations/organizationsApi";

/** Match public URL slug to an organization from API list. */
export function organizationSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

export function findOrganizationBySlug(
  organizations: Organization[],
  slug: string,
): Organization | undefined {
  return organizations.find((org) => organizationSlug(org.name) === slug);
}
