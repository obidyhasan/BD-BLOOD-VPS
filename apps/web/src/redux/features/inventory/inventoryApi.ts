import { baseApi } from "../../api/baseApi";

export interface OrganizationInventoryRecord {
  id: string;
  organizationId: string;
  bloodGroupId: string;
  availableUnits: number;
  lastUpdated: string;
  bloodGroup: { id: string; groupName: string };
  organization?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrganizationInventory: builder.query<
      { success: boolean; data: OrganizationInventoryRecord[] },
      string
    >({
      query: (organizationId) => ({
        url: `/organization-inventory/organization/${organizationId}`,
      }),
      providesTags: (_, __, organizationId) => [
        { type: "OrganizationInventory", id: organizationId },
      ],
    }),

    getAllInventory: builder.query<
      {
        success: boolean;
        meta: { page: number; limit: number; total: number };
        data: OrganizationInventoryRecord[];
      },
      {
        page?: number;
        limit?: number;
        organizationId?: string;
        bloodGroupId?: string;
        divisionId?: string;
        districtId?: string;
        upazilaId?: string;
      } | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) qp.append(k, String(v));
          });
        }
        const qs = qp.toString();
        return { url: `/organization-inventory${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["OrganizationInventory"],
    }),

  }),
});

export const {
  useGetOrganizationInventoryQuery,
  useGetAllInventoryQuery,
} = inventoryApi;
