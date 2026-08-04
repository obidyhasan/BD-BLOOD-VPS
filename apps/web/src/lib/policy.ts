import type { Policy } from "@/redux/features/policies/policiesApi";

export type PolicyItemUI = {
  id: string;
  category: "Safety" | "Admin" | "Donor" | "Privacy";
  title: string;
  description: string;
  active: boolean;
  lastUpdated: string;
};

const CATEGORY_TO_UI: Record<Policy["category"], PolicyItemUI["category"]> = {
  SAFETY: "Safety",
  ADMIN: "Admin",
  DONOR: "Donor",
  PRIVACY: "Privacy",
};

const CATEGORY_TO_API: Record<PolicyItemUI["category"], Policy["category"]> = {
  Safety: "SAFETY",
  Admin: "ADMIN",
  Donor: "DONOR",
  Privacy: "PRIVACY",
};

export function mapPolicyToUI(policy: Policy): PolicyItemUI {
  return {
    id: policy.id,
    category: CATEGORY_TO_UI[policy.category],
    title: policy.title,
    description: policy.description,
    active: policy.active,
    lastUpdated: new Date(
      policy.lastUpdated ?? policy.updatedAt,
    ).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  };
}

export function mapCategoryLabelToApi(
  label: string,
): Policy["category"] | undefined {
  if (label in CATEGORY_TO_API) {
    return CATEGORY_TO_API[label as PolicyItemUI["category"]];
  }
  return undefined;
}
