import { baseApi } from "../../api/baseApi";

export interface BloodDonation {
  id: string;
  donorId: string;
  donor: {
    id: string;
    fullName: string;
    email: string;
    profilePhoto?: string | null;
    bloodGroup: { groupName: string };
  };
  recipientName?: string | null;
  hospitalName: string;
  divisionId: string;
  districtId: string;
  upazilaId: string;
  organizationId?: string | null;
  organization?: { id: string; name: string } | null;
  donationDate: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface BloodDonationQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED";
  donorId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateBloodDonationPayload {
  requestAssignmentId?: string;
  recipientName?: string;
  hospitalName?: string;
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  organizationId?: string;
  donationDate: string;
  notes?: string;
}

export const bloodDonationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllDonations: builder.query<
      { success: boolean; meta: object; data: BloodDonation[] },
      BloodDonationQueryParams | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) qp.append(k, String(v));
          });
        }
        const qs = qp.toString();
        return { url: `/blood-donations${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["BloodDonations"],
    }),

    getMyDonations: builder.query<
      { success: boolean; meta: object; data: BloodDonation[] },
      BloodDonationQueryParams | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) qp.append(k, String(v));
          });
        }
        const qs = qp.toString();
        return { url: `/blood-donations/me${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["BloodDonations"],
    }),

    getOrganizationDonations: builder.query<
      { success: boolean; meta: object; data: BloodDonation[] },
      { organizationId: string; params?: BloodDonationQueryParams }
    >({
      query: ({ organizationId, params }) => {
        const qp = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) qp.append(key, String(value));
          });
        }
        const query = qp.toString();
        return {
          url: `/blood-donations/organization/${organizationId}${query ? `?${query}` : ""}`,
        };
      },
      providesTags: ["BloodDonations"],
    }),

    getSingleDonation: builder.query<
      { success: boolean; data: BloodDonation },
      string
    >({
      query: (id) => ({ url: `/blood-donations/${id}` }),
      providesTags: (_, __, id) => [{ type: "BloodDonations", id }],
    }),

    createDonation: builder.mutation<
      { success: boolean; data: BloodDonation },
      CreateBloodDonationPayload
    >({
      query: (data) => ({ url: "/blood-donations", method: "POST", body: data }),
      invalidatesTags: ["BloodDonations"],
    }),

    updateDonation: builder.mutation<
      { success: boolean; data: BloodDonation },
      { id: string; data: Partial<CreateBloodDonationPayload> }
    >({
      query: ({ id, data }) => ({
        url: `/blood-donations/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["BloodDonations"],
    }),

    verifyDonation: builder.mutation<
      { success: boolean; data: BloodDonation },
      { id: string; notes?: string }
    >({
      query: ({ id, notes }) => ({
        url: `/blood-donations/${id}/verify`,
        method: "POST",
        body: { notes },
      }),
      invalidatesTags: ["BloodDonations", "BloodRequests"],
    }),

    rejectDonation: builder.mutation<
      { success: boolean; data: BloodDonation },
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/blood-donations/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["BloodDonations", "BloodRequests"],
    }),

    reverseDonation: builder.mutation<
      { success: boolean; data: BloodDonation },
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/blood-donations/${id}/reverse`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: ["BloodDonations", "BloodRequests", "Achievements"],
    }),

    deleteDonation: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({ url: `/blood-donations/${id}`, method: "DELETE" }),
      invalidatesTags: ["BloodDonations"],
    }),
  }),
});

export const {
  useGetAllDonationsQuery,
  useGetMyDonationsQuery,
  useGetOrganizationDonationsQuery,
  useGetSingleDonationQuery,
  useCreateDonationMutation,
  useUpdateDonationMutation,
  useVerifyDonationMutation,
  useRejectDonationMutation,
  useReverseDonationMutation,
  useDeleteDonationMutation,
} = bloodDonationsApi;
