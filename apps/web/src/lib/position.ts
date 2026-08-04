import type { OrganizationPosition } from "@/redux/features/organizations/organizationsApi";

export type SystemPositionUI = {
  id: string;
  name: string;
  members: number;
  level: "Executive" | "Management" | "Support";
  status: "Main Role" | "Assistant" | "Active" | "General";
};

const LEVEL_TO_UI: Record<OrganizationPosition["level"], SystemPositionUI["level"]> = {
  EXECUTIVE: "Executive",
  MANAGEMENT: "Management",
  SUPPORT: "Support",
};

const STATUS_TO_UI: Record<
  OrganizationPosition["positionStatus"],
  SystemPositionUI["status"]
> = {
  MAIN_ROLE: "Main Role",
  ASSISTANT: "Assistant",
  ACTIVE: "Active",
  GENERAL: "General",
};

const LEVEL_TO_API: Record<SystemPositionUI["level"], OrganizationPosition["level"]> = {
  Executive: "EXECUTIVE",
  Management: "MANAGEMENT",
  Support: "SUPPORT",
};

const STATUS_TO_API: Record<
  SystemPositionUI["status"],
  OrganizationPosition["positionStatus"]
> = {
  "Main Role": "MAIN_ROLE",
  Assistant: "ASSISTANT",
  Active: "ACTIVE",
  General: "GENERAL",
};

export function mapOrganizationPositionToUI(
  pos: OrganizationPosition,
): SystemPositionUI {
  return {
    id: pos.id,
    name: pos.positionName,
    members: pos.members?.length ?? 0,
    level: LEVEL_TO_UI[pos.level] ?? "Support",
    status: STATUS_TO_UI[pos.positionStatus] ?? "General",
  };
}

export function mapUIToCreatePositionPayload(data: {
  name: string;
  level: SystemPositionUI["level"];
  status: SystemPositionUI["status"];
}) {
  return {
    positionName: data.name,
    positionOrder: 0,
    level: LEVEL_TO_API[data.level],
    positionStatus: STATUS_TO_API[data.status],
  };
}

export function mapUIToUpdatePositionPayload(data: {
  name: string;
  level: SystemPositionUI["level"];
  status: SystemPositionUI["status"];
}) {
  return mapUIToCreatePositionPayload(data);
}
