import { baseApi } from "../../api/baseApi";

export interface PlatformStats {
  donors: {
    total: number;
    available: number;
    unavailable: number;
  };
  organizations: {
    total: number;
    verified: number;
    pending: number;
  };
  bloodRequests: {
    total: number;
    fulfilled: number;
    pending: number;
    fulfilmentRate: number;
  };
  donations: {
    total: number;
    verified: number;
    pending: number;
  };
  content: {
    blogs: number;
    posts: number;
    works: number;
    events: number;
    pendingPosts: number;
  };
  geo: {
    districts: number;
    upazilas: number;
  };
  notifications: {
    total: number;
    unread: number;
  };
}

export interface BloodGroupStat {
  label: string;
  count: number;
  available: number;
}

export interface DonorGrowthStat {
  month: string;
  donors: number;
}

export interface OrganizationStats {
  organizationId: string;
  members: number;
  activeDonors: number;
  inventoryUnits: number;
  totalRequests: number;
  pendingRequests: number;
  fulfilledRequests: number;
  pendingPosts: number;
  organizationPosts: number;
  pendingContentApprovals: number;
}

export interface OrganizationShortage {
  id: string;
  name: string;
  location: string;
  lowGroups: string[];
  outGroups: string[];
}

export interface PublicStats {
  donorsTotal: number;
  donorsAvailable: number;
  fulfilledRequests: number;
  pendingRequests: number;
  totalRequests: number;
  verifiedOrganizations: number;
  worksCount: number;
  donationsTotal: number;
  districtsCovered: number;
  upazilasCovered: number;
  fulfilmentRate: number;
}

export interface ActivityFeedItem {
  id: string;
  date: string;
  org: string;
  action: string;
  status: string;
  type: string;
  createdAt: string;
}

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicStats: builder.query<
      { success: boolean; data: PublicStats },
      void
    >({
      query: () => ({ url: "/analytics/public-stats" }),
      providesTags: ["Analytics"],
    }),

    getActivityFeed: builder.query<
      { success: boolean; data: ActivityFeedItem[] },
      { limit?: number; organizationId?: string } | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params?.limit) qp.append("limit", String(params.limit));
        if (params?.organizationId) qp.append("organizationId", params.organizationId);
        const qs = qp.toString();
        return { url: `/analytics/activity-feed${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["Analytics"],
    }),

    getPlatformStats: builder.query<
      { success: boolean; data: PlatformStats },
      void
    >({
      query: () => ({ url: "/analytics/stats" }),
      providesTags: ["Analytics"],
    }),

    getBloodGroupStats: builder.query<
      { success: boolean; data: BloodGroupStat[] },
      void
    >({
      query: () => ({ url: "/analytics/blood-groups" }),
      providesTags: ["Analytics"],
    }),

    getDonorGrowthStats: builder.query<
      { success: boolean; data: DonorGrowthStat[] },
      void
    >({
      query: () => ({ url: "/analytics/donor-growth" }),
      providesTags: ["Analytics"],
    }),

    getOrganizationShortages: builder.query<
      { success: boolean; data: OrganizationShortage[] },
      void
    >({
      query: () => ({ url: "/analytics/organization-shortages" }),
      providesTags: ["Analytics"],
    }),

    getOrganizationStats: builder.query<
      { success: boolean; data: OrganizationStats },
      { organizationId?: string } | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params?.organizationId) {
          qp.append("organizationId", params.organizationId);
        }
        const qs = qp.toString();
        return { url: `/analytics/organization-stats${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["Analytics"],
    }),
  }),
});

export const {
  useGetPublicStatsQuery,
  useGetActivityFeedQuery,
  useGetPlatformStatsQuery,
  useGetBloodGroupStatsQuery,
  useGetDonorGrowthStatsQuery,
  useGetOrganizationShortagesQuery,
  useGetOrganizationStatsQuery,
} = analyticsApi;
