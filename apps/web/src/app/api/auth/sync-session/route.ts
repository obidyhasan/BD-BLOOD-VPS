import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAMES = ["accessToken", "refreshToken"] as const;
const COOKIE_PATHS = [
  "/",
  "/api",
  "/api/auth",
  "/api/auth/sync-session",
  "/api/v1",
  "/api/v1/auth",
];
const AUTH_COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN || ".bdblood.org";
const COOKIE_DOMAINS =
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

const isProd = process.env.NODE_ENV === "production";

function buildCookie(
  name: string,
  value: string,
  options: {
    path: string;
    maxAge: number;
    expires?: Date;
    domain?: string;
  },
) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAge}`,
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (isProd) parts.push("Secure");

  return parts.join("; ");
}

function appendExpiredAuthCookies(response: NextResponse) {
  for (const name of AUTH_COOKIE_NAMES) {
    for (const path of COOKIE_PATHS) {
      for (const domain of COOKIE_DOMAINS) {
        response.headers.append(
          "Set-Cookie",
          buildCookie(name, "", {
            ...(domain ? { domain } : {}),
            path,
            maxAge: 0,
            expires: new Date(0),
          }),
        );
      }
    }
  }
}

function appendAuthCookie(
  response: NextResponse,
  name: (typeof AUTH_COOKIE_NAMES)[number],
  value: string,
  maxAge: number,
) {
  response.headers.append(
    "Set-Cookie",
    buildCookie(name, value, {
      path: "/",
      maxAge,
      ...(isProd ? { domain: AUTH_COOKIE_DOMAIN } : {}),
    }),
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      accessToken?: string;
      refreshToken?: string;
    };

    if (!body.accessToken || typeof body.accessToken !== "string") {
      return NextResponse.json(
        { success: false, message: "Access token is required" },
        { status: 400 },
      );
    }

    const response = NextResponse.json({ success: true });

    // Clear duplicate path/domain variants first, then write one canonical host cookie.
    appendExpiredAuthCookies(response);
    appendAuthCookie(response, "accessToken", body.accessToken, 60 * 60);

    if (body.refreshToken && typeof body.refreshToken === "string") {
      appendAuthCookie(
        response,
        "refreshToken",
        body.refreshToken,
        60 * 60 * 24 * 30,
      );
    }

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to sync session" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Session cleared successfully",
  });

  appendExpiredAuthCookies(response);

  return response;
}
