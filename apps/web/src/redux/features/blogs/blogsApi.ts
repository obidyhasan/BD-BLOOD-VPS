import { baseApi } from "../../api/baseApi";

export interface BlogType {
  id: string;
  title: string;
  slug?: string | null;
  content: string;
  coverImage?: string | null;
  authorId: string;
  organizationId?: string | null;
  organization?: { id: string; name: string } | null;
  author?: {
    id: string;
    fullName: string;
    email: string;
    profilePhoto?: string | null;
  } | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reads: number;
  published_at?: string | null;
  publishedAt?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface PaginatedBlogs {
  success: boolean;
  message: string;
  meta: { page: number; limit: number; total: number };
  data: BlogType[];
}

export interface BlogQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const blogsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Public: approved only
    getPublicBlogs: builder.query<PaginatedBlogs, BlogQueryParams | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) qp.append(k, String(v));
          });
        }
        const qs = qp.toString();
        return { url: `/blogs${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["Blogs"],
    }),

    getPublicBlogById: builder.query<
      { success: boolean; data: BlogType },
      string
    >({
      query: (id) => ({ url: `/blogs/${id}` }),
      providesTags: (_, __, id) => [{ type: "Blogs", id }],
    }),

    getPublicBlogBySlug: builder.query<
      { success: boolean; data: BlogType },
      string
    >({
      query: (slug) => ({ url: `/blogs/by-slug/${slug}` }),
      providesTags: (_, __, slug) => [{ type: "Blogs", id: slug }],
    }),

    // Admin: all blogs
    getAdminBlogs: builder.query<PaginatedBlogs, BlogQueryParams | void>({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) qp.append(k, String(v));
          });
        }
        const qs = qp.toString();
        return { url: `/blogs/admin/all${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["Blogs"],
    }),

    getManagedBlogs: builder.query<PaginatedBlogs, BlogQueryParams & { organizationId: string }>({
      query: (params) => {
        const qp = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => value != null && qp.set(key, String(value)));
        return { url: `/blogs/manage?${qp.toString()}` };
      },
      providesTags: ["Blogs"],
    }),

    getAdminBlogById: builder.query<
      { success: boolean; data: BlogType },
      string
    >({
      query: (id) => ({ url: `/blogs/admin/${id}` }),
      providesTags: (_, __, id) => [{ type: "Blogs", id }],
    }),

    createBlog: builder.mutation<
      { success: boolean; data: BlogType },
      { title: string; content: string; coverImage?: string; organizationId?: string }
    >({
      query: (data) => ({ url: "/blogs", method: "POST", body: data }),
      invalidatesTags: ["Blogs", "Analytics"],
    }),

    updateBlog: builder.mutation<
      { success: boolean; data: BlogType },
      {
        id: string;
        data: Partial<Pick<BlogType, "title" | "content" | "coverImage">>;
      }
    >({
      query: ({ id, data }) => ({
        url: `/blogs/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Blogs", "Analytics"],
    }),

    updateBlogStatus: builder.mutation<
      { success: boolean; data: BlogType },
      { id: string; status: "PENDING" | "APPROVED" | "REJECTED" }
    >({
      query: ({ id, status }) => ({
        url: `/blogs/admin/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Blogs", "Analytics"],
    }),

    deleteBlog: builder.mutation<{ success: boolean; message: string }, string>(
      {
        query: (id) => ({ url: `/blogs/${id}`, method: "DELETE" }),
        invalidatesTags: ["Blogs", "Analytics"],
      },
    ),

    incrementReadCount: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/blogs/${id}/read`, method: "POST" }),
    }),
  }),
});

export const {
  useGetPublicBlogsQuery,
  useGetPublicBlogByIdQuery,
  useGetPublicBlogBySlugQuery,
  useGetAdminBlogsQuery,
  useGetManagedBlogsQuery,
  useGetAdminBlogByIdQuery,
  useCreateBlogMutation,
  useUpdateBlogMutation,
  useUpdateBlogStatusMutation,
  useDeleteBlogMutation,
  useIncrementReadCountMutation,
} = blogsApi;
