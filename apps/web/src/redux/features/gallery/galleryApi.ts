import { baseApi } from "../../api/baseApi";

export interface GalleryItem {
  id: string;
  title: string;
  description?: string | null;
  // category matches frontend GalleryAsset.category
  category?: string | null;
  // slug matches frontend GalleryAsset.slug (for URL routing)
  slug: string;
  // coverImage matches frontend GalleryAsset.img
  coverImage?: string | null;
  images: string[];
  // null -> Homepage Gallery item (admin-only, not owned by any Organization)
  organizationId: string | null;
  organization?: { id: string; name: string } | null;
  createdAt: string;
}

export const galleryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllGalleries: builder.query<
      { success: boolean; meta: object; data: GalleryItem[] },
      | {
          page?: number;
          limit?: number;
          organizationId?: string;
          // "homepage" -> Homepage Gallery items only (organizationId IS NULL)
          scope?: "homepage";
        }
      | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) qp.append(k, String(v));
          });
        }
        const qs = qp.toString();
        return { url: `/galleries${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["Gallery"],
    }),

    getSingleGallery: builder.query<
      { success: boolean; data: GalleryItem },
      string
    >({
      query: (id) => ({ url: `/galleries/${id}` }),
      providesTags: (_, __, id) => [{ type: "Gallery", id }],
    }),

    getGalleryBySlug: builder.query<
      { success: boolean; data: GalleryItem },
      string
    >({
      query: (slug) => ({ url: `/galleries/by-slug/${slug}` }),
      providesTags: (_, __, slug) => [{ type: "Gallery", id: slug }],
    }),

    createGallery: builder.mutation<
      { success: boolean; data: GalleryItem },
      // organizationId omitted -> Homepage Gallery item (Admin-only,
      // enforced server-side).
      Partial<GalleryItem> & { organizationId?: string; images: string[] }
    >({
      query: (data) => ({ url: "/galleries", method: "POST", body: data }),
      invalidatesTags: ["Gallery"],
    }),

    updateGallery: builder.mutation<
      { success: boolean; data: GalleryItem },
      { id: string; data: Partial<GalleryItem> }
    >({
      query: ({ id, data }) => ({
        url: `/galleries/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Gallery"],
    }),

    deleteGallery: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({ url: `/galleries/${id}`, method: "DELETE" }),
      invalidatesTags: ["Gallery"],
    }),
  }),
});

export const {
  useGetAllGalleriesQuery,
  useGetSingleGalleryQuery,
  useGetGalleryBySlugQuery,
  useCreateGalleryMutation,
  useUpdateGalleryMutation,
  useDeleteGalleryMutation,
} = galleryApi;
