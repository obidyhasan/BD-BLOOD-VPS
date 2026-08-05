import { baseApi } from "../../api/baseApi";

export interface MedicalInstitution {
  id: string;
  name: string;
  // type matches frontend institutions.type ("Public Hospital", "Government", "Private Clinic")
  type?: string | null;
  phone: string;
  address: string;
  logo?: string | null;
  coverImage?: string | null;
  divisionId: string;
  districtId: string;
  upazilaId: string;
  division?: { name: string };
  district?: { name: string };
  upazila?: { name: string };
  // openStatus matches frontend institutions.status ("Open 24/7", "Closes 10 PM")
  openStatus?: string | null;
  slug?: string | null;
  doctors?: Doctor[];
}

export interface Doctor {
  id: string;
  institutionId: string;
  name: string;
  specialization: string;
  phone: string;
  visitingHours?: string | null;
  // experience matches frontend doctors.exp
  experience?: string | null;
  institution?: { name: string };
}

export interface MedicalInfo {
  id: string;
  institutionId: string;
  title: string;
  content: string;
  // category matches frontend medicalInfos.category
  category?: string | null;
  createdBy: string;
  status: "DRAFT" | "PUBLISHED";
  createdAt: string;
}

export interface MedicalAd {
  id: string;
  title: string;
  imageUrl: string;
  institutionId: string;
  institution?: {
    id: string;
    name: string;
    slug?: string | null;
    phone: string;
    address: string;
  };
  redirectUrl?: string | null;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "INACTIVE";
  createdBy: string;
  createdAt: string;
}

export const medicalInstitutionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Institutions
    getAllInstitutions: builder.query<
      { success: boolean; meta: object; data: MedicalInstitution[] },
      {
        page?: number;
        limit?: number;
        searchTerm?: string;
        districtId?: string;
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
        return { url: `/medical-institutions${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["MedicalInstitutions"],
    }),

    getSingleInstitution: builder.query<
      { success: boolean; data: MedicalInstitution },
      string
    >({
      query: (id) => ({ url: `/medical-institutions/${id}` }),
      providesTags: (_, __, id) => [{ type: "MedicalInstitutions", id }],
    }),

    getInstitutionBySlug: builder.query<
      { success: boolean; data: MedicalInstitution },
      string
    >({
      query: (slug) => ({ url: `/medical-institutions/by-slug/${slug}` }),
      providesTags: (_, __, slug) => [
        { type: "MedicalInstitutions", id: slug },
      ],
    }),

    createInstitution: builder.mutation<
      { success: boolean; data: MedicalInstitution },
      Partial<MedicalInstitution>
    >({
      query: (data) => ({
        url: "/medical-institutions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["MedicalInstitutions"],
    }),

    updateInstitution: builder.mutation<
      { success: boolean; data: MedicalInstitution },
      { id: string; data: Partial<MedicalInstitution> }
    >({
      query: ({ id, data }) => ({
        url: `/medical-institutions/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["MedicalInstitutions"],
    }),

    deleteInstitution: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/medical-institutions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["MedicalInstitutions"],
    }),

    // Doctors
    getAllDoctors: builder.query<
      { success: boolean; data: Doctor[] },
      { institutionId?: string } | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) qp.append(k, String(v));
          });
        }
        const qs = qp.toString();
        return { url: `/doctors${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["Doctors"],
    }),

    createDoctor: builder.mutation<
      { success: boolean; data: Doctor },
      Omit<Doctor, "id" | "institution">
    >({
      query: (data) => ({ url: "/doctors", method: "POST", body: data }),
      invalidatesTags: ["Doctors", "MedicalInstitutions"],
    }),

    deleteDoctor: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({ url: `/doctors/${id}`, method: "DELETE" }),
      invalidatesTags: ["Doctors"],
    }),

    // Medical informations
    getAllMedicalInfos: builder.query<
      { success: boolean; data: MedicalInfo[] },
      { institutionId?: string; status?: string } | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) qp.append(k, String(v));
          });
        }
        const qs = qp.toString();
        return { url: `/medical-informations${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["MedicalInfos"],
    }),

    createMedicalInfo: builder.mutation<
      { success: boolean; data: MedicalInfo },
      Omit<MedicalInfo, "id" | "createdAt">
    >({
      query: (data) => ({
        url: "/medical-informations",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["MedicalInfos"],
    }),

    deleteMedicalInfo: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/medical-informations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["MedicalInfos"],
    }),

    // Medical advertisements
    getPublicAds: builder.query<{ success: boolean; data: MedicalAd[] }, void>({
      query: () => ({ url: "/medical-advertisements?limit=8" }),
      providesTags: ["MedicalAds"],
    }),

    getAdminAds: builder.query<{ success: boolean; data: MedicalAd[] }, void>({
      query: () => ({ url: "/medical-advertisements/admin/all" }),
      providesTags: ["MedicalAds"],
    }),

    createAd: builder.mutation<
      { success: boolean; data: MedicalAd },
      Omit<MedicalAd, "id" | "createdAt" | "institution" | "createdBy">
    >({
      query: (data) => ({
        url: "/medical-advertisements",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["MedicalAds"],
    }),

    updateAd: builder.mutation<
      { success: boolean; data: MedicalAd },
      { id: string; data: Partial<MedicalAd> }
    >({
      query: ({ id, data }) => ({
        url: `/medical-advertisements/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["MedicalAds"],
    }),

    updateAdStatus: builder.mutation<
      { success: boolean; data: MedicalAd },
      { id: string; status: "ACTIVE" | "INACTIVE" }
    >({
      query: ({ id, status }) => ({
        url: `/medical-advertisements/${id}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["MedicalAds"],
    }),

    deleteAd: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/medical-advertisements/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["MedicalAds"],
    }),
  }),
});

export const {
  useGetAllInstitutionsQuery,
  useGetSingleInstitutionQuery,
  useGetInstitutionBySlugQuery,
  useCreateInstitutionMutation,
  useUpdateInstitutionMutation,
  useDeleteInstitutionMutation,
  useGetAllDoctorsQuery,
  useCreateDoctorMutation,
  useDeleteDoctorMutation,
  useGetAllMedicalInfosQuery,
  useCreateMedicalInfoMutation,
  useDeleteMedicalInfoMutation,
  useGetPublicAdsQuery,
  useGetAdminAdsQuery,
  useCreateAdMutation,
  useUpdateAdMutation,
  useUpdateAdStatusMutation,
  useDeleteAdMutation,
} = medicalInstitutionsApi;
