import { AccountStatus } from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../errors/ApiError";
import { IJWTPayload } from "../types";
import { prisma } from "./prisma";

/** Resolve the authenticated actor and enforce the account invariants shared by mutations. */
export const getActiveActorDonor = async (user: IJWTPayload) => {
  const donor = await prisma.donor.findUnique({ where: { email: user.email } });

  if (!donor) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  if (donor.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User is deleted!");
  }
  if (donor.accountStatus !== AccountStatus.ACTIVE) {
    throw new ApiError(httpStatus.FORBIDDEN, `User is ${donor.accountStatus}`);
  }

  return donor;
};
