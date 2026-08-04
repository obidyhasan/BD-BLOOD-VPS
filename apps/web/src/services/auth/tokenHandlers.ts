import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";

const AUTH_COOKIE_PATHS = ["/", "/api", "/api/v1", "/api/v1/auth"];
const AUTH_COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN || ".bdblood.org";
const AUTH_COOKIE_DOMAINS =
  process.env.NODE_ENV === "production"
    ? [undefined, AUTH_COOKIE_DOMAIN, "api.bdblood.org", "bdblood.org", ".bdblood.org", "www.bdblood.org"]
    : [undefined];

export const setCookie = async (
  key: string,
  value: string,
  options: Partial<ResponseCookie>,
) => {
  try {
    const cookieStore = await cookies();
    cookieStore.set(key, value, {
      ...options,
      ...(process.env.NODE_ENV === "production"
        ? { domain: AUTH_COOKIE_DOMAIN }
        : {}),
    });
  } catch {
    // Cookies cannot be set during static generation.
  }
};

export const getCookie = async (key: string) => {
  const cookieStore = await cookies();
  return cookieStore.get(key)?.value || null;
};

export const deleteCookie = async (key: string) => {
  try {
    const cookieStore = await cookies();
    for (const path of AUTH_COOKIE_PATHS) {
      for (const domain of AUTH_COOKIE_DOMAINS) {
        cookieStore.set(key, "", {
          ...(domain ? { domain } : {}),
          path,
          maxAge: 0,
          expires: new Date(0),
        });
      }
    }
  } catch {
    // Ignore immutable cookie contexts.
  }
};
