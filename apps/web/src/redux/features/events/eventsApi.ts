import { baseApi } from "../../api/baseApi";

export interface Event {
  id: string;
  organizationId: string;
  organization?: { id: string; name: string };
  slug?: string | null;
  title: string;
  description?: string | null;
  eventType:
    | "DONATION_CAMP"
    | "WORKSHOP"
    | "AWARENESS"
    | "SOCIAL_ACTIVITY"
    | "BLOOD_CAMP";
  eventDate: string;
  // eventTime matches frontend eventData.ts time field
  eventTime?: string | null;
  // slots matches frontend eventData.ts slots field
  slots?: string | null;
  divisionId: string;
  districtId: string;
  upazilaId: string;
  division?: { name: string };
  district?: { name: string };
  upazila?: { name: string };
  locationDetails?: string | null;
  _count?: { participants: number };
  createdAt: string;
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
}

export interface EventParticipant {
  id: string;
  eventId: string;
  donorId: string;
  participationType: "DONOR" | "VOLUNTEER";
  createdAt?: string;
  donor?: {
    id: string;
    fullName: string;
    email?: string;
    phone?: string | null;
  };
}

export interface EventQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  eventType?: Event["eventType"];
  organizationId?: string;
  districtId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const eventsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllEvents: builder.query<
      { success: boolean; meta: object; data: Event[] },
      EventQueryParams | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) qp.append(k, String(v));
          });
        }
        const qs = qp.toString();
        return { url: `/events${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["Events"],
    }),

    getManagedEvents: builder.query<
      { success: boolean; meta: object; data: Event[] },
      EventQueryParams & { organizationId: string }
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => value != null && qp.set(key, String(value)));
        return { url: `/events/manage?${qp.toString()}` };
      },
      providesTags: ["Events"],
    }),

    getAdminEvents: builder.query<{ success: boolean; meta: object; data: Event[] }, EventQueryParams | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) Object.entries(params).forEach(([key, value]) => value != null && qp.set(key, String(value)));
        const qs = qp.toString();
        return { url: `/events/admin/all${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["Events"],
    }),

    updateEventApproval: builder.mutation<
      { success: boolean; data: Event },
      { id: string; approvalStatus: "PENDING" | "APPROVED" | "REJECTED" }
    >({
      query: ({ id, approvalStatus }) => ({ url: `/events/admin/${id}/approval`, method: "PATCH", body: { approvalStatus } }),
      invalidatesTags: ["Events", "Analytics"],
    }),

    getSingleEvent: builder.query<{ success: boolean; data: Event }, string>({
      query: (id) => ({ url: `/events/${id}` }),
      providesTags: (_, __, id) => [{ type: "Events", id }],
    }),

    getEventBySlug: builder.query<{ success: boolean; data: Event }, string>({
      query: (slug) => ({ url: `/events/by-slug/${slug}` }),
      providesTags: (_, __, slug) => [{ type: "Events", id: slug }],
    }),

    createEvent: builder.mutation<
      { success: boolean; data: Event },
      Omit<
        Event,
        | "id"
        | "createdAt"
        | "organization"
        | "division"
        | "district"
        | "upazila"
        | "_count"
      >
    >({
      query: (data) => ({ url: "/events", method: "POST", body: data }),
      invalidatesTags: ["Events", "Analytics"],
    }),

    updateEvent: builder.mutation<
      { success: boolean; data: Event },
      { id: string; data: Partial<Event> }
    >({
      query: ({ id, data }) => ({
        url: `/events/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Events", "Analytics"],
    }),

    deleteEvent: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({ url: `/events/${id}`, method: "DELETE" }),
      invalidatesTags: ["Events", "Analytics"],
    }),

    joinEvent: builder.mutation<
      { success: boolean; message: string },
      { eventId: string; participationType: "DONOR" | "VOLUNTEER" }
    >({
      query: (data) => ({
        url: `/events/${data.eventId}/join`,
        method: "POST",
        body: { participationType: data.participationType },
      }),
      invalidatesTags: ["Events", "Analytics"],
    }),

    getEventParticipants: builder.query<
      { success: boolean; meta: object; data: EventParticipant[] },
      { id: string; page?: number; limit?: number }
    >({
      query: ({ id, ...params }) => {
        const qp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null) qp.append(k, String(v));
        });
        const qs = qp.toString();
        return { url: `/events/${id}/participants${qs ? `?${qs}` : ""}` };
      },
      providesTags: (_, __, { id }) => [{ type: "Events", id }],
    }),
  }),
});

export const {
  useGetAllEventsQuery,
  useGetManagedEventsQuery,
  useGetAdminEventsQuery,
  useUpdateEventApprovalMutation,
  useGetSingleEventQuery,
  useGetEventBySlugQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useJoinEventMutation,
  useGetEventParticipantsQuery,
} = eventsApi;
