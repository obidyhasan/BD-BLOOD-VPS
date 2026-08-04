import type { BloodRequest } from "../bloodRequests/bloodRequestsApi";
import { baseApi } from "../../api/baseApi";

export type BloodRequestNotification = {
  id: string;
  requestId: string;
  organizationId: string;
  smsSent: boolean;
  createdAt: string;
  organization?: { id: string; name: string; phone: string };
  request?: BloodRequest;
};

export const bloodRequestNotificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrganizationBloodRequestNotifications: builder.query<
      {
        success: boolean;
        data: BloodRequestNotification[];
        meta?: { page: number; limit: number; total: number };
      },
      { page?: number; limit?: number; requestId?: string; organizationId?: string } | void
    >({
      query: (params) => ({
        url: "/blood-request-notifications/organization",
        params: params ?? {},
      }),
      providesTags: ["BloodRequests"],
    }),
  }),
});

export const { useGetOrganizationBloodRequestNotificationsQuery } =
  bloodRequestNotificationsApi;
