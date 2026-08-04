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

export const achievementsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyAchievements: builder.query<
      { success: boolean; data: MyAchievement[] },
      void
    >({
      query: () => ({ url: "/achievements/me" }),
      providesTags: ["Achievements"],
    }),
  }),
});

export const { useGetMyAchievementsQuery } = achievementsApi;
