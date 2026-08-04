import { baseApi } from "../../api/baseApi";

export interface Donor {
  id: string;
  slug?: string | null;
  fullName: string;
  email?: string;
  phone?: string | null;
  bloodGroupId: string;
  bloodGroup: { groupName: string };
  role?: "DONOR" | "ADMIN";
  divisionId?: string | null;
  districtId?: string | null;
  upazilaId?: string | null;
  division?: { name: string } | null;
  district?: { name: string } | null;
  upazila?: { name: string } | null;
  lastDonationDate?: string | null;
  nextEligibleDonationDate?: string | null;
  availabilityStatus: "AVAILABLE" | "UNAVAILABLE";
  profilePhoto?: string | null;
  bio?: string | null;
  accountStatus?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  isVerified: boolean;
  phoneVerified?: boolean;
  organization?: { organization?: { id: string; name: string; address?: string | null } | null } | null;
  createdAt: string;
}

export type PublicDonor = Omit<
  Donor,
  "email" | "phone" | "role" | "accountStatus"
>;

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  meta: { page: number; limit: number; total: number };
  data: T[];
}

export interface DonorQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  bloodGroupId?: string;
  districtId?: string;
  divisionId?: string;
  upazilaId?: string;
  availabilityStatus?: "AVAILABLE" | "UNAVAILABLE";
  accountStatus?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const donorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Public donor directory (available + verified only)
    getPublicDonors: builder.query<
      PaginatedResponse<PublicDonor>,
      DonorQueryParams | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) qp.append(k, String(v));
          });
        }
        const qs = qp.toString();
        return { url: `/user/public/donors${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["Donors"],
    }),

    getPublicDonorById: builder.query<
      { success: boolean; data: PublicDonor },
      string
    >({
      query: (id) => ({ url: `/user/public/donors/${id}` }),
      providesTags: (_, __, id) => [{ type: "Donors", id }],
    }),

    getPublicDonorBySlug: builder.query<
      { success: boolean; data: PublicDonor },
      string
    >({
      query: (slug) => ({ url: `/user/public/donors/by-slug/${slug}` }),
      providesTags: (_, __, slug) => [{ type: "Donors", id: slug }],
    }),

    // Admin: all donors
    getAllDonors: builder.query<
      PaginatedResponse<Donor>,
      DonorQueryParams | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) qp.append(k, String(v));
          });
        }
        const qs = qp.toString();
        return { url: `/user${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["Donors"],
    }),

    getDonorByEmail: builder.query<{ success: boolean; data: Donor }, string>({
      query: (email) => ({ url: `/user/${email}` }),
      providesTags: (_, __, email) => [{ type: "Donors", id: email }],
    }),

    getDonorById: builder.query<{ success: boolean; data: Donor }, string>({
      query: (id) => ({ url: `/user/admin/by-id/${id}` }),
      providesTags: (_, __, id) => [{ type: "Donors", id }],
    }),

    updateMyProfile: builder.mutation<
      { success: boolean; data: Donor },
      FormData
    >({
      query: (data) => ({
        url: "/user/update",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Auth", "Donors"],
    }),

    adminUpdateDonor: builder.mutation<
      { success: boolean; data: Donor },
      { id: string; data: Record<string, unknown> }
    >({
      query: ({ id, data }) => ({
        url: `/user/admin/by-id/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Donors"],
    }),

    deleteMyAccount: builder.mutation<
      { success: boolean; message: string },
      void
    >({
      query: () => ({ url: "/user/delete", method: "DELETE" }),
      invalidatesTags: ["Auth", "Donors"],
    }),
  }),
});

export const {
  useGetPublicDonorsQuery,
  useGetPublicDonorByIdQuery,
  useGetPublicDonorBySlugQuery,
  useGetAllDonorsQuery,
  useGetDonorByEmailQuery,
  useGetDonorByIdQuery,
  useUpdateMyProfileMutation,
  useAdminUpdateDonorMutation,
  useDeleteMyAccountMutation,
} = donorsApi;
