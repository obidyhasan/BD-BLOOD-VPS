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

type RawBaseQuery = ReturnType<typeof createBaseQuery>;

const backendBaseUrls = BACKEND_API_URLS.length
  ? BACKEND_API_URLS
  : [BACKEND_API_URL];

const rawBaseQueries = new Map<string, RawBaseQuery>(
  backendBaseUrls.map((baseUrl) => [baseUrl, createBaseQuery(baseUrl)]),
);

let refreshPromise: Promise<boolean> | null = null;

const requestUrl = (args: string | FetchArgs) =>
  typeof args === "string" ? args : args.url;

const refreshExcludedPaths = [
  "/auth/refresh-token",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/verify-password-reset-otp",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/resend-verification",
  "/auth/google",
];

const canRefreshRequest = (args: string | FetchArgs) =>
  !refreshExcludedPaths.some((path) => requestUrl(args).startsWith(path));

async function refreshBrowserSession(
  api: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2],
): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    for (const baseUrl of backendBaseUrls) {
      const query = rawBaseQueries.get(baseUrl) ?? createBaseQuery(baseUrl);
      const result = await query(
        { url: "/auth/refresh-token", method: "POST" },
        api,
        extraOptions,
      );
      if (!result.error) return true;
      if (result.error.status !== "FETCH_ERROR") return false;
    }
    return false;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

const baseQueryWithFallback: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let lastResult: Awaited<
    ReturnType<ReturnType<typeof createBaseQuery>>
  > | null = null;

  for (const baseUrl of backendBaseUrls) {
    const query = rawBaseQueries.get(baseUrl) ?? createBaseQuery(baseUrl);
    let result = await query(args, api, extraOptions);
    lastResult = result;

    if (result.error?.status === 401 && canRefreshRequest(args)) {
      const refreshed = await refreshBrowserSession(api, extraOptions);
      if (refreshed) {
        result = await query(args, api, extraOptions);
        lastResult = result;
      } else {
        // Clear any stale local profile only after the cookie-backed session
        // has been authoritatively rejected by both /me and refresh.
        api.dispatch({ type: "auth/logout" });
      }
    }

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
    "Achievements",
  ],
  endpoints: () => ({}),
});
