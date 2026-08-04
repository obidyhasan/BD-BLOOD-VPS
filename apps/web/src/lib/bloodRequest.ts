import type { BloodRequest as ApiBloodRequest } from "@/redux/features/bloodRequests/bloodRequestsApi";

/** UI table row shape for blood request management screens. */
export type BloodRequest = {
  id: number;
  name: string;
  phone: string;
  bloodGroup: string;
  hospital: string;
  quantity: string;
  needDate: string;
  problem: string;
  status: "pending" | "approved" | "rejected" | "processing" | "accepted";
  assignedDonors?: { id: number; name: string; slug: string }[];
  organizationName?: string;
  type: "URGENT" | "GENERAL";
};

export type BloodRequestRow = BloodRequest & { apiId: string };

const mapStatus = (status: ApiBloodRequest["status"]): BloodRequest["status"] => {
  switch (status) {
    case "PENDING":
      return "pending";
    case "PROCESSING":
      return "processing";
    case "FULFILLED":
      return "approved";
    case "CANCELLED":
    case "REJECTED":
      return "rejected";
    default:
      return "pending";
  }
};

export const mapApiBloodRequest = (
  r: ApiBloodRequest,
  index: number,
): BloodRequestRow => ({
  apiId: r.id,
  id: index + 1,
  name: r.requesterName,
  phone: r.requesterPhone,
  bloodGroup: r.bloodGroup?.groupName ?? "—",
  hospital: r.hospitalName,
  quantity: `${r.requiredUnits} Bag${r.requiredUnits > 1 ? "s" : ""}`,
  needDate: r.createdAt.split("T")[0],
  problem: r.message ?? "",
  status: mapStatus(r.status),
  type: r.requestType,
});

export const uiStatusToApi = (
  status: BloodRequest["status"],
): ApiBloodRequest["status"] => {
  switch (status) {
    case "pending":
      return "PENDING";
    case "processing":
      return "PROCESSING";
    case "approved":
    case "accepted":
      return "FULFILLED";
    case "rejected":
      return "REJECTED";
    default:
      return "PENDING";
  }
};
