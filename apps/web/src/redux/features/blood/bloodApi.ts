import { baseApi } from "../../api/baseApi";

export interface BloodGroup {
  id: string;
  groupName: string;
}

export const bloodApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBloodGroups: builder.query<
      { success: boolean; data: BloodGroup[] },
      { limit?: number } | void
    >({
      query: (params) => {
        const qp = new URLSearchParams({ limit: String(params?.limit ?? 50) });
        return { url: `/blood/groups?${qp.toString()}` };
      },
      providesTags: ["BloodGroups"],
    }),
  }),
});

export const { useGetBloodGroupsQuery } = bloodApi;
