import { baseApi } from "../../api/baseApi";

export interface DonationAppointment {
  id: string;
  donorId: string;
  organizationId: string;
  eventId?: string | null;
  bloodGroupId: string;
  scheduledAt: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes?: string | null;
  organization?: { id: string; name: string };
  event?: { id: string; title: string; slug?: string | null };
  bloodGroup?: { groupName: string };
}

export const appointmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyAppointments: builder.query<
      { success: boolean; data: DonationAppointment[]; meta?: object },
      { page?: number; limit?: number } | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params?.page) qp.append("page", String(params.page));
        if (params?.limit) qp.append("limit", String(params.limit));
        const qs = qp.toString();
        return { url: `/appointments/me${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["Appointments"],
    }),

    createAppointment: builder.mutation<
      { success: boolean; data: DonationAppointment },
      {
        organizationId: string;
        eventId?: string;
        bloodGroupId?: string;
        scheduledAt: string;
        notes?: string;
      }
    >({
      query: (body) => ({ url: "/appointments", method: "POST", body }),
      invalidatesTags: ["Appointments"],
    }),

    updateAppointmentStatus: builder.mutation<
      { success: boolean; data: DonationAppointment },
      { id: string; status: DonationAppointment["status"]; notes?: string }
    >({
      query: ({ id, status, notes }) => ({
        url: `/appointments/${id}/status`,
        method: "PATCH",
        body: { status, notes },
      }),
      invalidatesTags: ["Appointments"],
    }),

    cancelAppointment: builder.mutation<
      { success: boolean; data: DonationAppointment },
      string
    >({
      query: (id) => ({ url: `/appointments/${id}`, method: "DELETE" }),
      invalidatesTags: ["Appointments"],
    }),

    getOrganizationAppointments: builder.query<
      { success: boolean; data: DonationAppointment[]; meta?: object },
      { organizationId: string; page?: number; limit?: number }
    >({
      query: ({ organizationId, page, limit }) => {
        const qp = new URLSearchParams();
        if (page) qp.append("page", String(page));
        if (limit) qp.append("limit", String(limit));
        const qs = qp.toString();
        return {
          url: `/appointments/organization/${organizationId}${qs ? `?${qs}` : ""}`,
        };
      },
      providesTags: ["Appointments"],
    }),
  }),
});

export const {
  useGetMyAppointmentsQuery,
  useCreateAppointmentMutation,
  useUpdateAppointmentStatusMutation,
  useCancelAppointmentMutation,
  useGetOrganizationAppointmentsQuery,
} = appointmentsApi;
