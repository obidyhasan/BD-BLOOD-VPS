import { baseApi } from "../../api/baseApi";

export interface Division {
  id: string;
  name: string;
}

export interface District {
  id: string;
  name: string;
  divisionId: string;
}

export interface Upazila {
  id: string;
  name: string;
  districtId: string;
}

export const locationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDivisions: builder.query<
      { success: boolean; data: Division[] },
      void
    >({
      query: () => ({ url: "/location/divisions?limit=20" }),
      providesTags: ["Location"],
    }),

    getDistricts: builder.query<
      { success: boolean; data: District[] },
      { divisionId?: string; limit?: number } | void
    >({
      query: (params) => {
        const qp = new URLSearchParams({ limit: String(params?.limit ?? 100) });
        if (params?.divisionId) qp.set("divisionId", params.divisionId);
        return { url: `/location/districts?${qp.toString()}` };
      },
      providesTags: ["Location"],
    }),

    getUpazilas: builder.query<
      { success: boolean; data: Upazila[] },
      { districtId?: string; limit?: number } | void
    >({
      query: (params) => {
        const qp = new URLSearchParams({ limit: String(params?.limit ?? 200) });
        if (params?.districtId) qp.set("districtId", params.districtId);
        return { url: `/location/upazilas?${qp.toString()}` };
      },
      providesTags: ["Location"],
    }),
  }),
});

export const {
  useGetDivisionsQuery,
  useGetDistrictsQuery,
  useGetUpazilasQuery,
} = locationApi;
