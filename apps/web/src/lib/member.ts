import type { OrganizationMember } from "@/redux/features/organizations/organizationsApi";

/** UI model for organization member cards (legacy mock shape). */
export type OrgMemberUIModel = {
  id: string;
  donorId: string;
  slug: string;
  name: string;
  email: string;
  organizationId?: string;
  organizationName?: string;
  role: string;
  position: string;
  employeeId: string;
  joinedYear: string;
  clearanceLevel: number;
  status: "active" | "inactive";
  phone: string;
};

export function mapOrganizationMemberToUI(m: OrganizationMember): OrgMemberUIModel {
  const status =
    m.status === "ACTIVE"
      ? "active"
      : m.status === "PENDING"
        ? "inactive"
        : "inactive";

  return {
    id: m.id,
    donorId: m.donorId,
    slug: m.donorId,
    name: m.donor.fullName,
    email: m.donor.email,
    role: m.position.level.toLowerCase(),
    position: m.position.positionName,
    employeeId: m.id.slice(0, 8).toUpperCase(),
    joinedYear: new Date(m.joinedAt).getFullYear().toString(),
    clearanceLevel: m.position.positionOrder,
    status,
    phone: "",
  };
}
