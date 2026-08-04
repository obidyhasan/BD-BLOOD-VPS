import { baseApi } from "../../api/baseApi";

export interface ContactMessagePayload {
  name: string;
  email: string;
  message: string;
}

export type ContactMessageStatus = "NEW" | "READ" | "ARCHIVED";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: string;
  updatedAt: string;
}

export const contactApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    submitContactMessage: builder.mutation<
      { success: boolean; message: string; data: { id: string } },
      ContactMessagePayload
    >({
      query: (body) => ({
        url: "/contact",
        method: "POST",
        body,
      }),
    }),
    getContactMessages: builder.query<
      { success: boolean; message: string; data: ContactMessage[] },
      { limit?: number } | void
    >({
      query: (params) => ({
        url: `/contact${params?.limit ? `?limit=${params.limit}` : ""}`,
      }),
      providesTags: ["Contact"],
    }),
    updateContactMessageStatus: builder.mutation<
      { success: boolean; message: string; data: ContactMessage },
      { id: string; status: ContactMessageStatus }
    >({
      query: ({ id, status }) => ({
        url: `/contact/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Contact"],
    }),
  }),
});

export const {
  useSubmitContactMessageMutation,
  useGetContactMessagesQuery,
  useUpdateContactMessageStatusMutation,
} = contactApi;
