import { baseApi } from "../../api/baseApi";

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface FaqQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedFaqs {
  success: boolean;
  data: Faq[];
  meta?: { page: number; limit: number; total: number };
}

const buildFaqQuery = (params?: FaqQueryParams) => {
  const qp = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        qp.append(key, String(value));
      }
    });
  }
  const qs = qp.toString();
  return `/faqs${qs ? `?${qs}` : ""}`;
};

export const faqsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllFaqs: builder.query<PaginatedFaqs, FaqQueryParams | void>({
      query: (params) => ({ url: buildFaqQuery(params ?? undefined) }),
      providesTags: ["Faqs"],
    }),

    getSingleFaq: builder.query<{ success: boolean; data: Faq }, string>({
      query: (id) => ({ url: `/faqs/${id}` }),
      providesTags: (_, __, id) => [{ type: "Faqs", id }],
    }),

    createFaq: builder.mutation<
      { success: boolean; data: Faq },
      Pick<Faq, "question" | "answer" | "active" | "order"> & {
        category?: string;
      }
    >({
      query: (data) => ({ url: "/faqs", method: "POST", body: data }),
      invalidatesTags: ["Faqs"],
    }),

    updateFaq: builder.mutation<
      { success: boolean; data: Faq },
      { id: string; data: Partial<Omit<Faq, "id" | "createdAt" | "updatedAt">> }
    >({
      query: ({ id, data }) => ({
        url: `/faqs/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Faqs"],
    }),

    deleteFaq: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({ url: `/faqs/${id}`, method: "DELETE" }),
      invalidatesTags: ["Faqs"],
    }),
  }),
});

export const {
  useGetAllFaqsQuery,
  useGetSingleFaqQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
} = faqsApi;
