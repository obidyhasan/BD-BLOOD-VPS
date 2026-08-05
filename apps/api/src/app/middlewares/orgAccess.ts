import httpStatus from "http-status";
import { NextFunction, Request, Response } from "express";
import { OrganizationMemberStatus, PositionLevel, Role } from "@prisma/client";
import ApiError from "../errors/ApiError";
import { prisma } from "../shared/prisma";
import { IJWTPayload } from "../types";

export type OrgMembershipContext = {
  id: string;
  organizationId: string | null;
  donorId: string;
  positionId: string;
  status: OrganizationMemberStatus;
  position: { level: PositionLevel };
};

const getActiveMembership = async (
  email: string,
  organizationId: string,
): Promise<OrgMembershipContext | null> => {
  const donor = await prisma.donor.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!donor) return null;

  return prisma.organizationMember.findFirst({
    where: {
      donorId: donor.id,
      organizationId,
      status: OrganizationMemberStatus.ACTIVE,
      isDeleted: false,
    },
    include: {
      position: { select: { level: true } },
    },
  }) as Promise<OrgMembershipContext | null>;
};

const hasDashboardAccessLevel = (level?: PositionLevel) =>
  level === PositionLevel.EXECUTIVE || level === PositionLevel.MANAGEMENT;

export const canAccessOrganizationDashboard = (
  membership?: OrgMembershipContext | null,
) => hasDashboardAccessLevel(membership?.position?.level);

/** Allows ADMIN or an active member of the organization in params/body. */
export const orgMemberAccess = (
  organizationIdSource: "params" | "body" = "params",
) => {
  return async (
    req: Request & { user?: IJWTPayload; orgMembership?: OrgMembershipContext },
    _res: Response,
    next: NextFunction,
  ) => {
    try {
      const user = req.user;
      if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized");
      }

      const organizationId =
        organizationIdSource === "body"
          ? (req.body?.organizationId as string | undefined)
          : (req.params.organizationId as string | undefined);

      if (!organizationId) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Organization ID is required",
        );
      }

      if (user.role === Role.ADMIN) {
        return next();
      }

      const membership = await getActiveMembership(user.email, organizationId);
      if (!membership) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "You do not have access to this organization",
        );
      }

      req.orgMembership = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/** Requires EXECUTIVE or MANAGEMENT position (or ADMIN). Use after orgMemberAccess when not admin. */
export const orgManagerAccess = () => {
  return (
    req: Request & { user?: IJWTPayload; orgMembership?: OrgMembershipContext },
    _res: Response,
    next: NextFunction,
  ) => {
    if (req.user?.role === Role.ADMIN) {
      return next();
    }

    const level = req.orgMembership?.position?.level;
    if (hasDashboardAccessLevel(level)) {
      return next();
    }

    next(
      new ApiError(
        httpStatus.FORBIDDEN,
        "Insufficient organization permissions",
      ),
    );
  };
};

export const assertCanManageMember = async (
  user: IJWTPayload,
  memberId: string,
): Promise<OrgMembershipContext | null> => {
  if (user.role === Role.ADMIN) return null;

  const target = await prisma.organizationMember.findUnique({
    where: { id: memberId, isDeleted: false },
    select: { organizationId: true },
  });
  if (!target) {
    throw new ApiError(httpStatus.NOT_FOUND, "Organization member not found!");
  }
  if (!target.organizationId) {
    // National/Central members (organizationId: null) exist but are
    // outside any Organization's scope, so no org manager can reach them —
    // that's a 403, not a 404 (which would look like the row is missing).
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only an Admin can manage National Committee members",
    );
  }

  const membership = await getActiveMembership(
    user.email,
    target.organizationId,
  );
  if (!membership) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You do not have access to this organization",
    );
  }

  if (!hasDashboardAccessLevel(membership.position.level)) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Insufficient organization permissions",
    );
  }

  return membership;
};

export const assertCanAccessOrganizationDashboard = async (
  user: IJWTPayload,
  organizationId: string,
): Promise<OrgMembershipContext | null> => {
  if (user.role === Role.ADMIN) return null;

  const membership = await getActiveMembership(user.email, organizationId);
  if (!membership) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You do not have access to this organization",
    );
  }

  if (!canAccessOrganizationDashboard(membership)) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Insufficient organization permissions",
    );
  }

  return membership;
};

export const assertCanManageInventory = async (
  user: IJWTPayload,
  organizationId: string,
): Promise<void> => {
  await assertCanAccessOrganizationDashboard(user, organizationId);
};

/** Org managers may update requests handled by their organization. */
export const assertCanUpdateBloodRequest = async (
  user: IJWTPayload,
  requestId: string,
): Promise<string | null> => {
  if (user.role === Role.ADMIN) return null;

  const donor = await prisma.donor.findUnique({
    where: { email: user.email },
    select: { id: true },
  });
  if (!donor) {
    throw new ApiError(httpStatus.FORBIDDEN, "Donor profile not found");
  }

  const memberships = await prisma.organizationMember.findMany({
    where: {
      donorId: donor.id,
      organizationId: { not: null },
      status: OrganizationMemberStatus.ACTIVE,
      isDeleted: false,
      position: {
        level: { in: [PositionLevel.EXECUTIVE, PositionLevel.MANAGEMENT] },
      },
    },
    select: { organizationId: true },
  });

  const organizationIds = memberships
    .map((membership) => membership.organizationId)
    .filter((organizationId): organizationId is string =>
      Boolean(organizationId),
    );

  if (!organizationIds.length) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Insufficient organization permissions",
    );
  }

  const requestAccess = await prisma.bloodRequest.findFirst({
    where: {
      id: requestId,
      isDeleted: false,
      handledByOrganizationId: { in: organizationIds },
    },
    select: {
      id: true,
      handledByOrganizationId: true,
    },
  });

  if (!requestAccess) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Your organization does not have access to this blood request",
    );
  }

  return requestAccess.handledByOrganizationId;
};

export const assertCanManageInventoryItem = async (
  user: IJWTPayload,
  inventoryItemId: string,
): Promise<string> => {
  const item = await prisma.organizationBloodInventory.findUnique({
    where: { id: inventoryItemId, isDeleted: false },
    select: { organizationId: true },
  });
  if (!item) {
    throw new ApiError(httpStatus.NOT_FOUND, "Inventory item not found!");
  }

  await assertCanManageInventory(user, item.organizationId);
  return item.organizationId;
};

export const assertCanManageGallery = async (
  user: IJWTPayload,
  galleryId?: string,
  organizationId?: string,
): Promise<void> => {
  if (user.role === Role.ADMIN) return;

  let targetOrgId = organizationId;

  if (galleryId) {
    const gallery = await prisma.gallery.findUnique({
      where: { id: galleryId, isDeleted: false },
      select: { organizationId: true },
    });
    if (!gallery) {
      throw new ApiError(httpStatus.NOT_FOUND, "Gallery not found!");
    }
    if (!gallery.organizationId) {
      // Homepage Gallery item (organizationId: null) — admin-only, no
      // Organization can ever own or manage it. The item exists, so this
      // is a 403 (insufficient permission), not a 404.
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Only an Admin can manage Homepage Gallery items",
      );
    }
    targetOrgId = gallery.organizationId;
  }

  if (!targetOrgId) {
    // Creating with no organizationId at all is an attempt to create a
    // Homepage Gallery item, which only an Admin may do.
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only an Admin can create Homepage Gallery items",
    );
  }

  const membership = await getActiveMembership(user.email, targetOrgId);
  if (!membership) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You do not have access to this organization",
    );
  }

  if (!hasDashboardAccessLevel(membership.position.level)) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Insufficient organization permissions to manage galleries",
    );
  }
};
