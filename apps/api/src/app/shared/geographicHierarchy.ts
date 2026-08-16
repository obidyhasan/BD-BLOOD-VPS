import httpStatus from "http-status";
import { Prisma } from "@prisma/client";
import ApiError from "../errors/ApiError";

type GeoClient = Pick<Prisma.TransactionClient, "upazila">;

export const assertGeographicHierarchy = async (
  db: GeoClient,
  divisionId: string,
  districtId: string,
  upazilaId: string,
) => {
  const upazila = await db.upazila.findFirst({
    where: {
      id: upazilaId,
      districtId,
      isDeleted: false,
      district: {
        divisionId,
        isDeleted: false,
        division: { isDeleted: false },
      },
    },
    select: { id: true },
  });

  if (!upazila) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Division, District and Upazila must belong to the same geographic hierarchy.",
    );
  }
};
