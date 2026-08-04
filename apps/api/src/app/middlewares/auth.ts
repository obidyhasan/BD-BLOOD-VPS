import httpStatus from "http-status";
import { NextFunction, Request, Response } from "express";
import { jwtHelper } from "../helper/jwtHelper";
import config from "../config";
import ApiError from "../errors/ApiError";
import { prisma } from "../shared/prisma";
import { AccountStatus } from "@prisma/client";
import { cacheHelper } from "../helper/cacheHelper";

// This lookup runs on every single authenticated request (it's the DB
// round trip that re-verifies a token hasn't been revoked). Two changes
// from the original:
//   1. `select` only the four fields actually checked below, instead of
//      the full Donor row (password hash, bio, slug, notification prefs,
//      etc. were all being fetched and discarded on every request).
//   2. A short-TTL read-through cache (Redis, via the existing
//      cacheHelper) so most requests skip the DB round trip entirely.
//      5s keeps revocation (suspend/delete/unverify) effectively
//      near-real-time while still collapsing bursts of requests from the
//      same user onto one query — flagged as a candidate for this exact
//      treatment in the Phase 1 audit (§6.6).
const AUTH_USER_CACHE_TTL_SECONDS = 5;

type AuthCheckFields = {
  isVerified: boolean;
  role: string;
  accountStatus: AccountStatus;
  isDeleted: boolean;
};

const getAuthCheckUser = (email: string) =>
  cacheHelper.getOrSetCache<AuthCheckFields | null>(
    `auth:userCheck:${email}`,
    AUTH_USER_CACHE_TTL_SECONDS,
    async () => {
      const user = await prisma.donor.findUnique({
        where: { email },
        select: {
          isVerified: true,
          role: true,
          accountStatus: true,
          isDeleted: true,
        },
      });
      return user ?? null;
    },
  );

const auth = (...roles: string[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const bearer = req.headers.authorization;
      const token =
        req.cookies.accessToken ||
        (typeof bearer === "string" && bearer.startsWith("Bearer ")
          ? bearer.split(" ")[1]
          : undefined);
      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "No Token Received");
      }

      const verifyUser = jwtHelper.verifyToken(
        token,
        config.jwt.jwt_access_secret as string,
      );

      if (roles.length && !roles.includes(verifyUser.role)) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "You are not permitted to view this route!",
        );
      }

      const isUserExist = await getAuthCheckUser(verifyUser.email);

      if (!isUserExist)
        throw new ApiError(httpStatus.BAD_REQUEST, "User does not exist");

      if (!isUserExist.isVerified && isUserExist.role !== "ADMIN") {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "Please verify your email before continuing.",
          "",
          "EMAIL_NOT_VERIFIED",
        );
      }

      if (
        isUserExist.accountStatus === AccountStatus.SUSPENDED ||
        isUserExist.accountStatus === AccountStatus.INACTIVE
      ) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `User is ${isUserExist.accountStatus}`,
        );
      }

      if (isUserExist.isDeleted)
        throw new ApiError(httpStatus.BAD_REQUEST, "User has been deleted");

      req.user = verifyUser;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
