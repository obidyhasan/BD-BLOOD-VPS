import { baseApi } from "../../api/baseApi";

export type ReportTargetType = "DONOR" | "ORGANIZATION" | "POST" | "EVENT";

export interface Report {
  id: string;
  reportedBy: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  status: "PENDING" | "RESOLVED" | "REJECTED";
  createdAt: string;
  reporter?: { id: string; fullName: string; email: string };
}

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyReports: builder.query<{ success: boolean; data: Report[] }, void>({
      query: () => ({ url: "/reports/me" }),
      providesTags: ["Reports"],
    }),

    getAllReports: builder.query<
      { success: boolean; meta: object; data: Report[] },
      {
        status?: string;
        targetType?: string;
        page?: number;
        limit?: number;
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
        return { url: `/reports${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["Reports"],
    }),

    createReport: builder.mutation<
      { success: boolean; data: Report },
      { targetType: ReportTargetType; targetId: string; reason: string }
    >({
      query: (body) => ({ url: "/reports", method: "POST", body }),
      invalidatesTags: ["Reports"],
    }),

    updateReportStatus: builder.mutation<
      { success: boolean; data: Report },
      { id: string; status: "PENDING" | "RESOLVED" | "REJECTED" }
    >({
      query: ({ id, status }) => ({
        url: `/reports/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Reports"],
    }),

    deleteReport: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({ url: `/reports/${id}`, method: "DELETE" }),
      invalidatesTags: ["Reports"],
    }),
  }),
});

export const {
  useGetMyReportsQuery,
  useGetAllReportsQuery,
  useCreateReportMutation,
  useUpdateReportStatusMutation,
  useDeleteReportMutation,
} = reportsApi;
