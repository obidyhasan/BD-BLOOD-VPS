import { baseApi } from "../../api/baseApi";

export interface Post {
  id: string;
  donorId: string;
  organizationId?: string | null;
  donor: {
    id: string;
    fullName: string;
    email?: string;
    profilePhoto?: string | null;
    bloodGroup?: { groupName: string };
  };
  organization?: { id: string; name: string } | null;
  // postType matches frontend Post.type
  postType:
    | "URGENT"
    | "EMERGENCY"
    | "EVENT"
    | "ANNOUNCEMENT"
    | "GENERAL"
    | "RECAP"
    | "DONATION"
    | "HELP_REQUEST"
    | "SOCIAL_ACTIVITY";
  // visibility matches frontend Post.visibility
  visibility: "PUBLIC" | "PRIVATE";
  // isWork matches frontend Post.isWork (featured "Our Work" section)
  isWork: boolean;
  title: string;
  content: string;
  images: string[];
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  slug?: string;
  createdAt: string;
  donationId?: string | null;
  updatedAt: string;
  _count?: { likes: number; comments: number };
}

export interface DonationPostEligibility {
  id: string;
  donationDate: string;
  hospitalName: string;
  recipientName?: string | null;
  organization?: { id: string; name: string } | null;
}

export interface PostComment {
  id: string;
  postId: string;
  donorId: string;
  parentId?: string | null;
  content: string;
  createdAt: string;
  donor?: { id: string; fullName: string; profilePhoto?: string | null };
  replies?: PostComment[];
}

export interface PostQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  postType?: Post["postType"];
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  postScope?: "organization" | "donor";
  organizationId?: string;
  donorId?: string;
  isWork?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface HomepagePosts {
  successHistory: Post[];
  donorPosts: Post[];
}

export const postsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHomepagePosts: builder.query<
      { success: boolean; data: HomepagePosts },
      void
    >({
      query: () => ({ url: "/posts/homepage?successLimit=6&donorLimit=8" }),
      providesTags: ["Posts"],
    }),
    getPostEligibility: builder.query<
      { success: boolean; data: DonationPostEligibility[] },
      void
    >({
      query: () => ({ url: "/posts/post-eligibility" }),
      providesTags: ["BloodDonations", "Posts"],
    }),

    // Public: approved + public posts
    getMyPosts: builder.query<
      { success: boolean; meta: object; data: Post[] },
      PostQueryParams | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) qp.append(k, String(v));
          });
        }
        const qs = qp.toString();
        return { url: `/posts/my${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["Posts"],
    }),

    getMyPostBySlug: builder.query<{ success: boolean; data: Post }, string>({
      query: (slug) => ({ url: `/posts/my/by-slug/${slug}` }),
      providesTags: (_, __, slug) => [{ type: "Posts", id: `my-${slug}` }],
    }),

    getPublicPosts: builder.query<
      { success: boolean; meta: object; data: Post[] },
      PostQueryParams | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) qp.append(k, String(v));
          });
        }
        const qs = qp.toString();
        return { url: `/posts${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["Posts"],
    }),

    getPublicPostById: builder.query<{ success: boolean; data: Post }, string>({
      query: (id) => ({ url: `/posts/${id}` }),
      providesTags: (_, __, id) => [{ type: "Posts", id }],
    }),

    getPublicPostBySlug: builder.query<
      { success: boolean; data: Post },
      string
    >({
      query: (slug) => ({ url: `/posts/by-slug/${slug}` }),
      providesTags: (_, __, slug) => [{ type: "Posts", id: slug }],
    }),

    // Admin: all posts
    getOrgPosts: builder.query<
      { success: boolean; meta: object; data: Post[] },
      PostQueryParams | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) qp.append(k, String(v));
          });
        }
        const qs = qp.toString();
        return { url: `/posts/org/all${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["Posts"],
    }),

    getAdminPosts: builder.query<
      { success: boolean; meta: object; data: Post[] },
      PostQueryParams | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) qp.append(k, String(v));
          });
        }
        const qs = qp.toString();
        return { url: `/posts/admin/all${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["Posts"],
    }),

    createPost: builder.mutation<{ success: boolean; data: Post }, FormData>({
      query: (data) => ({ url: "/posts", method: "POST", body: data }),
      invalidatesTags: ["Posts", "Analytics"],
    }),

    updatePost: builder.mutation<
      { success: boolean; data: Post },
      { id: string; data: FormData }
    >({
      query: ({ id, data }) => ({
        url: `/posts/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Posts", "Analytics"],
    }),

    updatePostApproval: builder.mutation<
      { success: boolean; data: Post },
      { id: string; approvalStatus: "PENDING" | "APPROVED" | "REJECTED" }
    >({
      query: ({ id, approvalStatus }) => ({
        url: `/posts/admin/${id}/approval`,
        method: "PATCH",
        body: { approvalStatus },
      }),
      invalidatesTags: ["Posts", "Analytics"],
    }),

    updateOrgPostApproval: builder.mutation<
      { success: boolean; data: Post },
      { id: string; approvalStatus: "PENDING" | "APPROVED" | "REJECTED" }
    >({
      query: ({ id, approvalStatus }) => ({
        url: `/posts/org/${id}/approval`,
        method: "PATCH",
        body: { approvalStatus },
      }),
      invalidatesTags: ["Posts", "Analytics"],
    }),

    // Toggle isWork flag (featured in "Our Work" section)
    togglePostWork: builder.mutation<
      { success: boolean; data: Post },
      { id: string; isWork: boolean }
    >({
      query: ({ id, isWork }) => ({
        url: `/posts/admin/${id}/approval`,
        method: "PATCH",
        body: { isWork },
      }),
      invalidatesTags: ["Posts", "Analytics"],
    }),

    deletePost: builder.mutation<{ success: boolean; message: string }, string>(
      {
        query: (id) => ({ url: `/posts/${id}`, method: "DELETE" }),
        invalidatesTags: ["Posts", "Analytics"],
      },
    ),

    getPostComments: builder.query<
      { success: boolean; data: PostComment[] },
      string
    >({
      query: (id) => ({ url: `/posts/${id}/comments` }),
      providesTags: (_, __, id) => [{ type: "Posts", id: `comments-${id}` }],
    }),

    createPostComment: builder.mutation<
      { success: boolean; data: PostComment },
      { id: string; content: string; parentId?: string }
    >({
      query: ({ id, content, parentId }) => ({
        url: `/posts/${id}/comments`,
        method: "POST",
        body: { content, ...(parentId ? { parentId } : {}) },
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "Posts", id: `comments-${id}` },
        "Posts",
        "Analytics",
      ],
    }),

    togglePostLike: builder.mutation<
      { success: boolean; data: { liked: boolean; likeCount: number } },
      string
    >({
      query: (id) => ({ url: `/posts/${id}/like`, method: "POST" }),
      invalidatesTags: ["Posts", "Analytics"],
    }),
  }),
});

export const {
  useGetHomepagePostsQuery,
  useGetPostEligibilityQuery,
  useGetMyPostsQuery,
  useGetMyPostBySlugQuery,
  useGetPublicPostsQuery,
  useGetPublicPostByIdQuery,
  useGetPublicPostBySlugQuery,
  useGetOrgPostsQuery,
  useGetAdminPostsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useUpdatePostApprovalMutation,
  useUpdateOrgPostApprovalMutation,
  useTogglePostWorkMutation,
  useDeletePostMutation,
  useGetPostCommentsQuery,
  useCreatePostCommentMutation,
  useTogglePostLikeMutation,
} = postsApi;
