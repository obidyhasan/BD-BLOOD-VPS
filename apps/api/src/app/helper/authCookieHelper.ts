import { CookieOptions, Response } from "express";
import config from "../config";

const isProduction = config.node_env === "production";
const productionCookieDomain = config.auth_cookie_domain || ".bdblood.org";

const authCookieBaseOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  ...(isProduction ? { domain: productionCookieDomain } : {}),
};

const authCookieExpiry = {
  accessToken: 60 * 60 * 1000,
  refreshToken: 30 * 24 * 60 * 60 * 1000,
} as const;

const legacyCookieDomains = isProduction
  ? [
      undefined,
      productionCookieDomain,
      "api.bdblood.org",
      ".bdblood.org",
      "bdblood.org",
      "www.bdblood.org",
    ]
  : [undefined];

const legacyCookiePaths = ["/", "/api", "/api/auth", "/api/v1", "/api/v1/auth"];

export const setAuthCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken?: string },
) => {
  res.cookie("accessToken", tokens.accessToken, {
    ...authCookieBaseOptions,
    maxAge: authCookieExpiry.accessToken,
  });

  if (tokens.refreshToken) {
    res.cookie("refreshToken", tokens.refreshToken, {
      ...authCookieBaseOptions,
      maxAge: authCookieExpiry.refreshToken,
    });
  }
};

export const clearAuthCookies = (res: Response) => {
  for (const name of ["accessToken", "refreshToken"] as const) {
    for (const path of legacyCookiePaths) {
      for (const domain of legacyCookieDomains) {
        res.clearCookie(name, {
          httpOnly: true,
          secure: isProduction,
          sameSite: "lax",
          path,
          ...(domain ? { domain } : {}),
        });
      }
    }
  }
};
