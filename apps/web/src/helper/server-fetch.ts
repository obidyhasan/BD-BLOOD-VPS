import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@/services/auth/tokenHandlers";
import { CACHE_TAGS } from "@/lib/cache";
import { BACKEND_API_URL } from "@/lib/backend";

const isAuthEndpoint = (endpoint: string) =>
  endpoint.startsWith("/auth/login") ||
  endpoint.startsWith("/auth/register") ||
  endpoint.startsWith("/auth/verify-email") ||
  endpoint.startsWith("/auth/resend-verification") ||
  endpoint.startsWith("/auth/forgot-password") ||
  endpoint.startsWith("/auth/verify-password-reset-otp") ||
  endpoint.startsWith("/auth/reset-password") ||
  endpoint.startsWith("/auth/refresh-token") ||
  endpoint.startsWith("/auth/google");

const isPublicEndpoint = (endpoint: string) =>
  endpoint.startsWith("/posts") ||
  endpoint.startsWith("/blogs") ||
  endpoint.startsWith("/galleries") ||
  endpoint.startsWith("/events") ||
  endpoint.startsWith("/policies") ||
  endpoint.startsWith("/organizations") ||
  endpoint.startsWith("/organization-members/public/") ||
  endpoint.startsWith("/organization-members/organization/") ||
  endpoint.startsWith("/organization-positions") ||
  endpoint.startsWith("/medical-institutions") ||
  endpoint.startsWith("/doctors") ||
  endpoint.startsWith("/medical-informations") ||
  endpoint.startsWith("/medical-advertisements") ||
  endpoint.startsWith("/analytics/public-stats") ||
  endpoint.startsWith("/location/") ||
  endpoint.startsWith("/blood/groups") ||
  endpoint.startsWith("/user/public/") ||
  endpoint.startsWith("/blood-requests") ||
  endpoint.startsWith("/contact") ||
  endpoint.startsWith("/auth/");

const isPrivateEndpoint = (endpoint: string) =>
  endpoint.startsWith("/user/me") ||
  endpoint.startsWith("/user/update") ||
  endpoint.startsWith("/user/delete") ||
  endpoint.startsWith("/user/admin") ||
  endpoint.startsWith("/blood-donations") ||
  endpoint.startsWith("/notifications") ||
  endpoint.startsWith("/reports") ||
  endpoint.startsWith("/appointments") ||
  (endpoint.startsWith("/analytics/") &&
    !endpoint.startsWith("/analytics/public-stats")) ||
  endpoint.startsWith("/posts/my") ||
  endpoint.startsWith("/posts/org") ||
  endpoint.startsWith("/posts/admin") ||
  endpoint.startsWith("/organization-inventory") ||
  endpoint.startsWith("/organization-members/me") ||
  endpoint.startsWith("/organization-members/join") ||
  endpoint.startsWith("/organization-members/leave") ||
  endpoint.startsWith("/organization-members/assign") ||
  endpoint.startsWith("/organizations/membership");

const getCacheTagsForEndpoint = (
  endpoint: string,
  method: string,
): string[] => {
  if (method !== "GET") return [];

  if (endpoint.startsWith("/posts")) {
    if (endpoint === "/posts" || endpoint.startsWith("/posts?")) {
      return [CACHE_TAGS.POSTS];
    }
    const match = endpoint.match(/^\/posts\/([^/?]+)/);
    if (match) return [CACHE_TAGS.POST(match[1]), CACHE_TAGS.POSTS];
  }

  if (endpoint.startsWith("/blogs")) {
    if (endpoint === "/blogs" || endpoint.startsWith("/blogs?")) {
      return [CACHE_TAGS.BLOGS];
    }
    const match = endpoint.match(/^\/blogs\/([^/?]+)/);
    if (match) return [CACHE_TAGS.BLOG(match[1]), CACHE_TAGS.BLOGS];
  }

  if (endpoint.startsWith("/galleries")) {
    if (endpoint === "/galleries" || endpoint.startsWith("/galleries?")) {
      return [CACHE_TAGS.GALLERY];
    }
    const match = endpoint.match(/^\/galleries\/(?!by-slug\/)([^/?]+)/);
    if (match) return [CACHE_TAGS.GALLERY_ITEM(match[1]), CACHE_TAGS.GALLERY];
    return [CACHE_TAGS.GALLERY];
  }
  if (endpoint.startsWith("/organizations")) {
    if (
      endpoint === "/organizations" ||
      endpoint.startsWith("/organizations?")
    ) {
      return [CACHE_TAGS.ORGANIZATIONS];
    }
    const match = endpoint.match(/^\/organizations\/(?!by-slug\/)([^/?]+)/);
    if (match)
      return [CACHE_TAGS.ORGANIZATION(match[1]), CACHE_TAGS.ORGANIZATIONS];
    return [CACHE_TAGS.ORGANIZATIONS];
  }
  if (endpoint.startsWith("/policies")) return [CACHE_TAGS.POLICIES];
  if (endpoint.startsWith("/medical-institutions")) {
    if (
      endpoint === "/medical-institutions" ||
      endpoint.startsWith("/medical-institutions?")
    ) {
      return [CACHE_TAGS.MEDICAL_INSTITUTIONS];
    }
    const match = endpoint.match(
      /^\/medical-institutions\/(?!by-slug\/)([^/?]+)/,
    );
    if (match)
      return [
        CACHE_TAGS.MEDICAL_INSTITUTION(match[1]),
        CACHE_TAGS.MEDICAL_INSTITUTIONS,
      ];
    return [CACHE_TAGS.MEDICAL_INSTITUTIONS];
  }
  if (endpoint.startsWith("/doctors")) return [CACHE_TAGS.DOCTORS];
  if (endpoint.startsWith("/medical-informations")) {
    return [CACHE_TAGS.MEDICAL_INFOS];
  }
  if (endpoint.startsWith("/medical-advertisements")) {
    return [CACHE_TAGS.MEDICAL_ADS];
  }
  if (endpoint.startsWith("/events")) return [CACHE_TAGS.EVENTS];
  if (endpoint.startsWith("/faqs")) return [CACHE_TAGS.FAQS];
  if (endpoint.startsWith("/blood-requests")) {
    return [CACHE_TAGS.BLOOD_REQUESTS];
  }
  if (endpoint.startsWith("/user/public/donors")) {
    return [CACHE_TAGS.DONORS_PUBLIC];
  }
  if (endpoint.startsWith("/analytics/public-stats"))
    return [CACHE_TAGS.ANALYTICS];
  if (endpoint.startsWith("/analytics/stats")) return [CACHE_TAGS.ANALYTICS];

  return [];
};

const getCacheDuration = (endpoint: string): number => {
  if (endpoint.startsWith("/policies")) return 24 * 3600;
  if (endpoint.startsWith("/location/")) return 24 * 3600;
  if (endpoint.startsWith("/blogs")) return 1800;
  if (endpoint.startsWith("/posts")) return 1800;
  if (endpoint.startsWith("/organizations")) return 3600;
  if (endpoint.startsWith("/analytics/public-stats")) return 300;
  if (endpoint.startsWith("/analytics/stats")) return 300;
  // Time-sensitive: an URGENT request going stale in the public feed for a
  // full 5 minutes defeats the point of the feature, so this stays short
  // even though it's now also tag-invalidated on every mutation below.
  if (endpoint.startsWith("/blood-requests")) return 60;
  return 300;
};

let pendingRefreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  if (pendingRefreshPromise) return pendingRefreshPromise;

  const refreshToken = await getCookie("refreshToken");
  if (!refreshToken) return null;

  const refreshPromise = (async (): Promise<string | null> => {
    try {
      const refreshRes = await fetch(`${BACKEND_API_URL}/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `refreshToken=${encodeURIComponent(refreshToken)}`,
        },
      });

      if (!refreshRes.ok) {
        await deleteCookie("accessToken");
        await deleteCookie("refreshToken");
        return null;
      }

      const refreshJson = await refreshRes.json();
      const nextAccessToken = refreshJson?.data?.accessToken ?? null;
      const nextRefreshToken = refreshJson?.data?.refreshToken ?? null;
      if (!nextAccessToken) return null;

      try {
        await setCookie("accessToken", nextAccessToken, {
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          maxAge: 60 * 60,
          path: "/",
          sameSite: "lax",
        });
      } catch {
        // Response may be immutable in some contexts.
      }

      if (nextRefreshToken) {
        try {
          await setCookie("refreshToken", nextRefreshToken, {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
            sameSite: "lax",
          });
        } catch {
          // Ignore.
        }
      }

      return nextAccessToken;
    } finally {
      pendingRefreshPromise = null;
    }
  })();

  pendingRefreshPromise = refreshPromise;
  return refreshPromise;
};

const buildHeaders = (
  headers: HeadersInit | undefined,
  accessToken: string | null,
): HeadersInit => ({
  ...headers,
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
});

const serverFetchHelper = async (
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> => {
  const { headers, ...restOptions } = options;
  const method = options.method || "GET";

  const cacheTags = getCacheTagsForEndpoint(endpoint, method);
  const cacheDuration = getCacheDuration(endpoint);

  const accessToken = isPublicEndpoint(endpoint)
    ? null
    : await getCookie("accessToken");

  const fetchOptions: RequestInit = {
    headers: buildHeaders(headers, accessToken),
    ...restOptions,
    method,
  };

  if (method === "GET") {
    if (isPrivateEndpoint(endpoint) || !isPublicEndpoint(endpoint)) {
      fetchOptions.cache = "no-store";
    } else {
      (
        fetchOptions as RequestInit & {
          next?: { tags: string[]; revalidate: number };
        }
      ).next = {
        tags: cacheTags,
        revalidate: cacheDuration,
      };
    }
  } else {
    fetchOptions.cache = "no-store";
  }

  let response = await fetch(`${BACKEND_API_URL}${endpoint}`, fetchOptions);

  if (
    response.status !== 401 ||
    isAuthEndpoint(endpoint) ||
    isPublicEndpoint(endpoint)
  ) {
    return response;
  }

  const nextAccessToken = await refreshAccessToken();
  if (!nextAccessToken) return response;

  const retryOptions: RequestInit = {
    ...fetchOptions,
    headers: buildHeaders(headers, nextAccessToken),
  };

  response = await fetch(`${BACKEND_API_URL}${endpoint}`, retryOptions);
  return response;
};

export const serverFetch = {
  get: async (endpoint: string, options: RequestInit = {}) =>
    serverFetchHelper(endpoint, { ...options, method: "GET" }),
  post: async (endpoint: string, options: RequestInit = {}) =>
    serverFetchHelper(endpoint, { ...options, method: "POST" }),
  put: async (endpoint: string, options: RequestInit = {}) =>
    serverFetchHelper(endpoint, { ...options, method: "PUT" }),
  patch: async (endpoint: string, options: RequestInit = {}) =>
    serverFetchHelper(endpoint, { ...options, method: "PATCH" }),
  delete: async (endpoint: string, options: RequestInit = {}) =>
    serverFetchHelper(endpoint, { ...options, method: "DELETE" }),
};

export const unwrap = async <T = unknown>(res: Response): Promise<T> => {
  const json = await res.json();
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || "Request failed");
  }
  return (json?.data ?? json) as T;
};
