import { baseApi } from "../../api/baseApi";

export interface Policy {
  id: string;
  category: "SAFETY" | "ADMIN" | "DONOR" | "PRIVACY";
  title: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastUpdated?: string;
}

export const policiesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllPolicies: builder.query<
      { success: boolean; data: Policy[] },
      { category?: Policy["category"]; active?: boolean } | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) qp.append(k, String(v));
          });
        }
        const qs = qp.toString();
        return { url: `/policies${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["Policies"],
    }),

    getSinglePolicy: builder.query<{ success: boolean; data: Policy }, string>({
      query: (id) => ({ url: `/policies/${id}` }),
      providesTags: (_, __, id) => [{ type: "Policies", id }],
    }),

    createPolicy: builder.mutation<
      { success: boolean; data: Policy },
      Omit<Policy, "id" | "createdAt" | "updatedAt">
    >({
      query: (data) => ({ url: "/policies", method: "POST", body: data }),
      invalidatesTags: ["Policies"],
    }),

    updatePolicy: builder.mutation<
      { success: boolean; data: Policy },
      { id: string; data: Partial<Policy> }
    >({
      query: ({ id, data }) => ({
        url: `/policies/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Policies"],
    }),

    deletePolicy: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({ url: `/policies/${id}`, method: "DELETE" }),
      invalidatesTags: ["Policies"],
    }),
  }),
});

export const {
  useGetAllPoliciesQuery,
  useGetSinglePolicyQuery,
  useCreatePolicyMutation,
  useUpdatePolicyMutation,
  useDeletePolicyMutation,
} = policiesApi;
