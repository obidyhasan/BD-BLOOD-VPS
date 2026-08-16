import { baseApi } from "../../api/baseApi";

export interface MyAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  thresholdType: "VERIFIED_DONATIONS" | "TOTAL_DONATIONS";
  thresholdValue: number;
  active: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AchievementInput = Pick<
  MyAchievement,
  "title" | "description" | "icon" | "thresholdType" | "thresholdValue" | "active"
>;

export const achievementsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyAchievements: builder.query<
      { success: boolean; data: MyAchievement[] },
      void
    >({
      query: () => ({ url: "/achievements/me" }),
      providesTags: ["Achievements"],
    }),
    getAdminAchievements: builder.query<
      { success: boolean; data: MyAchievement[]; meta: { total: number } },
      void
    >({
      query: () => ({ url: "/achievements?limit=200&sortBy=thresholdValue&sortOrder=asc" }),
      providesTags: ["Achievements"],
    }),
    createAchievement: builder.mutation<{ success: boolean; data: MyAchievement }, AchievementInput>({
      query: (body) => ({ url: "/achievements", method: "POST", body }),
      invalidatesTags: ["Achievements"],
    }),
    updateAchievement: builder.mutation<
      { success: boolean; data: MyAchievement },
      { id: string; data: Partial<AchievementInput> }
    >({
      query: ({ id, data }) => ({ url: `/achievements/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["Achievements"],
    }),
    deleteAchievement: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/achievements/${id}`, method: "DELETE" }),
      invalidatesTags: ["Achievements"],
    }),
  }),
});

export const {
  useGetMyAchievementsQuery,
  useGetAdminAchievementsQuery,
  useCreateAchievementMutation,
  useUpdateAchievementMutation,
  useDeleteAchievementMutation,
} = achievementsApi;
