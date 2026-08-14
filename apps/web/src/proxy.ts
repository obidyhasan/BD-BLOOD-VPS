import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { BACKEND_API_URL } from "@/lib/backend";
import { readSetCookieValue } from "@/lib/setCookieHeader";

// Auth routes that authenticated users should not access
const authRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/auth/google/callback",
];

// Private routes that require authentication
const privateRoutes = ["/dashboard", "/change-password"];

const AUTH_COOKIE_PATHS = ["/", "/api", "/api/v1", "/api/v1/auth"];
const AUTH_COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN || ".bdblood.org";
const AUTH_COOKIE_DOMAINS =
  process.env.NODE_ENV === "production"
    ? [
        undefined,
        AUTH_COOKIE_DOMAIN,
        "api.bdblood.org",
        "bdblood.org",
        ".bdblood.org",
        "www.bdblood.org",
      ]
    : [undefined];

function expireAuthCookie(response: NextResponse, name: string) {
  for (const path of AUTH_COOKIE_PATHS) {
    for (const domain of AUTH_COOKIE_DOMAINS) {
      response.cookies.set(name, "", {
        ...(domain ? { domain } : {}),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path,
        maxAge: 0,
        expires: new Date(0),
      });
    }
  }
}

function setCanonicalAuthCookie(
  response: NextResponse,
  name: "accessToken" | "refreshToken",
  value: string,
  maxAge: number,
) {
  expireAuthCookie(response, name);
  response.cookies.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
    ...(process.env.NODE_ENV === "production"
      ? { domain: AUTH_COOKIE_DOMAIN }
      : {}),
  });
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(`${BACKEND_API_URL}/auth/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `refreshToken=${encodeURIComponent(refreshToken)}`,
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const accessToken = readSetCookieValue(res.headers, "accessToken");
  const nextRefreshToken = readSetCookieValue(res.headers, "refreshToken");
  return { accessToken, refreshToken: nextRefreshToken };
}

async function fetchMyMembership(accessToken: string) {
  const res = await fetch(`${BACKEND_API_URL}/organization-members/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return json?.success ? (json?.data ?? null) : null;
}

/**
 * Reads the `role`/`exp` claims out of the access token's payload segment
 * without verifying its signature.
 *
 * Trade-off, by design: full HMAC verification would be the stronger
 * option, but doing that from Edge middleware requires the JWT signing
 * secret to also be configured on the frontend deployment, which isn't set
 * up today (see .env.example) — shipping that blind risks a total
 * private-route lockout for every user if it's ever missing/mismatched at
 * deploy time. This is safe *as a routing/UX gate* because it never becomes
 * the actual authorization boundary: every real data-fetching API call is
 * independently, cryptographically re-verified (and re-checked against
 * live account status) by the backend's own auth middleware. Worst case
 * for a tampered token here is an admin-shaped page shell that then fails
 * to load any real data — not access to any actually-protected resource.
 *
 * If stronger middleware-level verification is wanted later, add `jose`
 * (Edge-compatible) plus a shared `JWT_ACCESS_SECRET` env var on the
 * frontend and swap this for real `jwtVerify()`.
 */
function decodeAccessTokenClaims(
  token: string,
): { role: string; exp: number } | null {
  try {
    const [, payloadSegment] = token.split(".");
    if (!payloadSegment) return null;

    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(atob(padded));

    if (typeof payload?.exp !== "number") return null;
    return { role: String(payload.role || ""), exp: payload.exp };
  } catch {
    return null;
  }
}

/** True if the token decodes and isn't expired (with a small clock-skew allowance). */
function hasLocallyValidToken(
  token: string,
): { role: string } | null {
  const claims = decodeAccessTokenClaims(token);
  if (!claims) return null;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const CLOCK_SKEW_LEEWAY_SECONDS = 5;
  if (claims.exp <= nowSeconds - CLOCK_SKEW_LEEWAY_SECONDS) return null;
  return { role: claims.role };
}
export async function proxy(request: NextRequest) {
  // Let server actions and RSC requests pass through unchanged.
  if (
    request.headers.get("next-action") ||
    request.headers.get("rsc") === "1"
  ) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  const redirectToLogin = () => {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  };

  // 1. Protect private routes
  for (const route of privateRoutes) {
    if (pathname.startsWith(route)) {
      let token = accessToken ?? null;
      let refreshed: {
        accessToken: string | null;
        refreshToken: string | null;
      } | null = null;

      if (!token && refreshToken) {
        refreshed = await refreshAccessToken(refreshToken);
        token = refreshed?.accessToken ?? null;
      }

      if (!token) return redirectToLogin();

      let claims = hasLocallyValidToken(token);
      if (!claims && refreshToken && !refreshed) {
        refreshed = await refreshAccessToken(refreshToken);
        token = refreshed?.accessToken ?? null;
        if (token) {
          claims = hasLocallyValidToken(token);
        }
      }

      if (!claims) return redirectToLogin();

      const role = claims.role;

      // RBAC for admin routes — only ADMIN role may access /dashboard/admin
      if (pathname.startsWith("/dashboard/admin")) {
        if (role !== "ADMIN")
          return NextResponse.redirect(new URL("/", request.url));
      }

      // Organization dashboards require an active organization membership.
      if (pathname.startsWith("/dashboard/organization")) {
        if (role !== "ADMIN") {
          const membership = await fetchMyMembership(token as string);
          if (
            !membership ||
            membership.status !== "ACTIVE" ||
            !membership.organizationId ||
            !membership.canAccessDashboard
          ) {
            return NextResponse.redirect(
              new URL("/dashboard/donor", request.url),
            );
          }
        }
      }

      const next = NextResponse.next();
      if (refreshed?.accessToken) {
        setCanonicalAuthCookie(
          next,
          "accessToken",
          refreshed.accessToken,
          60 * 60,
        );
      }
      if (refreshed?.refreshToken) {
        setCanonicalAuthCookie(
          next,
          "refreshToken",
          refreshed.refreshToken,
          60 * 60 * 24 * 30,
        );
      }
      break;
    }
  }

  // 2. Redirect away from auth pages if already authenticated (prevents auth page flashes)
  if (authRoutes.includes(pathname)) {
    let token = accessToken ?? null;
    let refreshed: {
      accessToken: string | null;
      refreshToken: string | null;
    } | null = null;

    if (!token && refreshToken) {
      refreshed = await refreshAccessToken(refreshToken);
      token = refreshed?.accessToken ?? null;
    }

    if (token) {
      let claims = hasLocallyValidToken(token);
      if (!claims && refreshToken && !refreshed) {
        refreshed = await refreshAccessToken(refreshToken);
        token = refreshed?.accessToken ?? null;
        if (token) {
          claims = hasLocallyValidToken(token);
        }
      }

      if (claims) {
        // Admins go to admin analytics, donors go to dashboard
        const redirectUrl =
          claims.role === "ADMIN"
            ? "/dashboard/admin/analytics"
            : "/dashboard/donor";
        const next = NextResponse.redirect(new URL(redirectUrl, request.url));
        if (refreshed?.accessToken) {
          setCanonicalAuthCookie(
            next,
            "accessToken",
            refreshed.accessToken,
            60 * 60,
          );
        }
        if (refreshed?.refreshToken) {
          setCanonicalAuthCookie(
            next,
            "refreshToken",
            refreshed.refreshToken,
            60 * 60 * 24 * 30,
          );
        }
        return next;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/auth/google/callback",
    "/change-password",
    "/dashboard",
    "/dashboard/:path*",
  ],
};
