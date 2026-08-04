import { baseApi } from "../../api/baseApi";
import type { Donor } from "../donors/donorsApi";

export type BloodRequestStatus =
  | "PENDING"
  | "SUBMITTED"
  | "PROCESSING"
  | "DONOR_FOUND"
  | "FULFILLED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";
export type RequestAssignmentStatus =
  | "PENDING"
  | "NOTIFIED"
  | "ACCEPTED"
  | "REJECTED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELLED"
  | "DONATION_PENDING"
  | "DONATED";

export interface RequestAssignment {
  id: string;
  requestId: string;
  donorId: string;
  status: RequestAssignmentStatus;
  assignedById: string;
  bagUnits: number;
  assignedAt: string;
  notifiedAt?: string | null;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  donationSubmittedAt?: string | null;
  donatedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  declineReason?: string | null;
  donor?: Donor;
  request?: BloodRequest;
}

export interface AssignmentSummary {
  requiredBags: number;
  committedBags: number;
  fulfilledBags: number;
  remainingCommitmentBags: number;
  remainingFulfillmentBags: number;
  notifiedDonors: number;
  acceptedDonors: number;
  pendingDonations: number;
  donatedDonors: number;
  inactiveAssignments: number;
}

export interface BloodRequest {
  id: string;
  referenceCode: string;
  requesterName: string;
  requesterPhone: string;
  bloodGroupId: string;
  bloodGroup: { groupName: string };
  hospitalName: string;
  divisionId: string;
  districtId: string;
  upazilaId: string;
  organizationId?: string | null;
  handledByOrganizationId?: string | null;
  organization?: { id: string; name: string } | null;
  division?: { name: string };
  district?: { name: string };
  upazila?: { name: string };
  requiredUnits: number;
  requestType: "URGENT" | "GENERAL";
  message?: string | null;
  status: BloodRequestStatus;
  acceptedAt?: string | null;
  donorFoundAt?: string | null;
  fulfilledAt?: string | null;
  handoverCompletedAt?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  cancelledById?: string | null;
  assignments?: RequestAssignment[];
  assignmentSummary?: AssignmentSummary;
  createdAt: string;
  updatedAt: string;
}

export interface EligibleDonor extends Donor {
  matchLevel: "UPAZILA" | "DISTRICT" | "DIVISION";
  addressRank: number;
  organization?: Donor["organization"];
}

export interface BloodRequestQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  status?: BloodRequest["status"];
  requestType?: "URGENT" | "GENERAL";
  bloodGroupId?: string;
  districtId?: string;
  organizationId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateBloodRequestPayload {
  requesterName: string;
  requesterPhone: string;
  bloodGroupId: string;
  hospitalName: string;
  divisionId: string;
  districtId: string;
  upazilaId: string;
  requiredUnits: number;
  requestType?: "URGENT" | "GENERAL";
  message?: string;
}

export const bloodRequestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllBloodRequests: builder.query<
      { success: boolean; meta: object; data: BloodRequest[] },
      BloodRequestQueryParams | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) qp.append(k, String(v));
          });
        }
        const qs = qp.toString();
        return { url: `/blood-requests${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["BloodRequests"],
    }),

    getSingleBloodRequest: builder.query<
      { success: boolean; data: BloodRequest },
      string
    >({
      query: (id) => ({ url: `/blood-requests/${id}` }),
      providesTags: (_, __, id) => [{ type: "BloodRequests", id }],
    }),

    createBloodRequest: builder.mutation<
      { success: boolean; data: BloodRequest },
      CreateBloodRequestPayload
    >({
      query: (data) => ({ url: "/blood-requests", method: "POST", body: data }),
      invalidatesTags: ["BloodRequests"],
    }),

    startProcessing: builder.mutation<
      { success: boolean; data: BloodRequest },
      string
    >({
      query: (id) => ({
        url: `/blood-requests/${id}/start-processing`,
        method: "POST",
      }),
      invalidatesTags: ["BloodRequests", "Notifications"],
    }),

    rejectBloodRequest: builder.mutation<
      { success: boolean; data: BloodRequest },
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/blood-requests/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["BloodRequests", "Notifications"],
    }),

    cancelBloodRequestCommand: builder.mutation<
      { success: boolean; data: BloodRequest },
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/blood-requests/${id}/cancel-command`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["BloodRequests", "Notifications"],
    }),

    completeHandover: builder.mutation<
      { success: boolean; data: BloodRequest },
      string
    >({
      query: (id) => ({
        url: `/blood-requests/${id}/complete-handover`,
        method: "POST",
      }),
      invalidatesTags: ["BloodRequests", "Notifications"],
    }),

    updateBloodRequestStatus: builder.mutation<
      { success: boolean; data: BloodRequest },
      { id: string; status: BloodRequest["status"] }
    >({
      query: ({ id, status }) => ({
        url: `/blood-requests/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["BloodRequests"],
    }),

    cancelBloodRequest: builder.mutation<
      { success: boolean; data: BloodRequest; message: string },
      string
    >({
      query: (id) => ({ url: `/blood-requests/${id}/cancel`, method: "POST" }),
      invalidatesTags: ["BloodRequests"],
    }),

    getEligibleDonors: builder.query<
      { success: boolean; data: { request: BloodRequest; organizationId: string; donors: EligibleDonor[] } },
      string
    >({
      query: (id) => ({ url: `/blood-requests/${id}/eligible-donors` }),
      providesTags: (_, __, id) => [{ type: "BloodRequests", id }],
    }),

    assignDonorsToRequest: builder.mutation<
      { success: boolean; data: { assignedCount: number; assignments: RequestAssignment[] } },
      { id: string; donorIds?: string[] }
    >({
      query: ({ id }) => ({
        url: `/blood-requests/${id}/assignments`,
        method: "POST",
      }),
      invalidatesTags: ["BloodRequests", "Notifications"],
    }),

    getRequestAssignment: builder.query<
      { success: boolean; data: RequestAssignment },
      string
    >({
      query: (assignmentId) => ({ url: `/blood-requests/assignments/${assignmentId}` }),
      providesTags: (_, __, id) => [{ type: "BloodRequests", id }],
    }),

    acceptRequestAssignment: builder.mutation<
      { success: boolean; data: RequestAssignment; message: string },
      string
    >({
      query: (assignmentId) => ({
        url: `/blood-requests/assignments/${assignmentId}/accept`,
        method: "PATCH",
      }),
      invalidatesTags: ["BloodRequests", "Notifications"],
    }),

    rejectRequestAssignment: builder.mutation<
      { success: boolean; data: RequestAssignment; message: string },
      { assignmentId: string; rejectionReason?: string }
    >({
      query: ({ assignmentId, rejectionReason }) => ({
        url: `/blood-requests/assignments/${assignmentId}/reject`,
        method: "PATCH",
        body: { rejectionReason },
      }),
      invalidatesTags: ["BloodRequests", "Notifications"],
    }),

    rematchOrganizations: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/blood-requests/${id}/rematch`,
        method: "POST",
      }),
      invalidatesTags: ["BloodRequests"],
    }),

    deleteBloodRequest: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({ url: `/blood-requests/${id}`, method: "DELETE" }),
      invalidatesTags: ["BloodRequests"],
    }),

    sendBloodRequestSms: builder.mutation<
      { success: boolean; message: string },
      { id: string; message: string }
    >({
      query: ({ id, message }) => ({
        url: `/blood-requests/${id}/send-sms`,
        method: "POST",
        body: { message },
      }),
    }),
  }),
});

export const {
  useGetAllBloodRequestsQuery,
  useGetSingleBloodRequestQuery,
  useCreateBloodRequestMutation,
  useStartProcessingMutation,
  useRejectBloodRequestMutation,
  useCancelBloodRequestCommandMutation,
  useCompleteHandoverMutation,
  useUpdateBloodRequestStatusMutation,
  useCancelBloodRequestMutation,
  useGetEligibleDonorsQuery,
  useAssignDonorsToRequestMutation,
  useGetRequestAssignmentQuery,
  useAcceptRequestAssignmentMutation,
  useRejectRequestAssignmentMutation,
  useRematchOrganizationsMutation,
  useDeleteBloodRequestMutation,
  useSendBloodRequestSmsMutation,
} = bloodRequestsApi;



