import { baseApi } from "../../api/baseApi";

export interface Notification {
  id: string;
  donorId: string;
  title: string;
  message: string;
  // Extended types matching frontend notificationService AdminNotification.type
  type:
    | "SYSTEM"
    | "BLOOD_REQUEST"
    | "BLOOD"
    | "EVENT"
    | "ORG"
    | "POST"
    | "ADMIN";
  // priority matches frontend AdminNotification.priority
  priority: "HIGH" | "MEDIUM" | "LOW" | "ROUTINE";
  relatedId?: string | null;
  relatedType?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface CreateNotificationPayload {
  donorId: string;
  title: string;
  message: string;
  type: Notification["type"];
  priority?: Notification["priority"];
  relatedId?: string;
  relatedType?: string;
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Authenticated user's own notifications
    getMyNotifications: builder.query<
      { success: boolean; data: Notification[]; meta: { page: number; limit: number; total: number } },
      { isRead?: boolean; limit?: number } | void
    >({
      query: (params) => {
        const query = new URLSearchParams();
        if (params?.isRead !== undefined) query.set("isRead", String(params.isRead));
        if (params?.limit !== undefined) query.set("limit", String(params.limit));
        const suffix = query.toString();
        return { url: `/notifications/me${suffix ? `?${suffix}` : ""}` };
      },
      providesTags: ["Notifications"],
    }),

    markNotificationRead: builder.mutation<
      { success: boolean; message: string },
      { id: string; isRead: boolean }
    >({
      query: ({ id, isRead }) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
        body: { isRead },
      }),
      invalidatesTags: ["Notifications"],
    }),

    markAllRead: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({ url: "/notifications/me/read-all", method: "POST" }),
      invalidatesTags: ["Notifications"],
    }),

    deleteNotification: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({ url: `/notifications/${id}`, method: "DELETE" }),
      invalidatesTags: ["Notifications"],
    }),

    // Admin: create system notification
    createNotification: builder.mutation<
      { success: boolean; data: Notification },
      CreateNotificationPayload
    >({
      query: (data) => ({
        url: "/notifications",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Notifications"],
    }),

    broadcastNotification: builder.mutation<
      { success: boolean; message: string; data: { count: number } },
      {
        title: string;
        message: string;
        type: Notification["type"];
        priority?: Notification["priority"];
      }
    >({
      query: (body) => ({
        url: "/notifications/broadcast",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
  useCreateNotificationMutation,
  useBroadcastNotificationMutation,
} = notificationsApi;
