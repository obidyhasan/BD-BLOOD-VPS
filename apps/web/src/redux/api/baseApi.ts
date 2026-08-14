import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { BACKEND_API_URL, BACKEND_API_URLS } from "@/lib/backend";

const createBaseQuery = (baseUrl: string) =>
  fetchBaseQuery({
    baseUrl,
    credentials: "include",
  });

const backendBaseUrls = BACKEND_API_URLS.length
  ? BACKEND_API_URLS
  : [BACKEND_API_URL];

const baseQueryWithFallback: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let lastResult: Awaited<
    ReturnType<ReturnType<typeof createBaseQuery>>
  > | null = null;

  for (const baseUrl of backendBaseUrls) {
    const result = await createBaseQuery(baseUrl)(args, api, extraOptions);
    lastResult = result;

    if (!result.error || result.error.status !== "FETCH_ERROR") {
      return result;
    }
  }

  return (
    lastResult ?? createBaseQuery(BACKEND_API_URL)(args, api, extraOptions)
  );
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithFallback,
  tagTypes: [
    "Auth",
    "User",
    "Donors",
    "Blogs",
    "BloodRequests",
    "BloodDonations",
    "Organizations",
    "OrganizationMembers",
    "OrganizationPositions",
    "OrganizationInventory",
    "Posts",
    "Events",
    "Gallery",
    "Notifications",
    "MedicalInstitutions",
    "Doctors",
    "MedicalInfos",
    "MedicalAds",
    "Analytics",
    "Policies",
    "Faqs",
    "Contact",
    "Reports",
    "BloodGroups",
    "Location",
    "Appointments",
    "Achievements",
  ],
  endpoints: () => ({}),
});
