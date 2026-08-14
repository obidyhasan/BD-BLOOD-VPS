import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import {
  GovernanceCategory,
  OrganizationMemberStatus,
  PositionLevel,
  PositionStatus,
  Role,
} from "@prisma/client";
import { prisma } from "../shared/prisma";

export async function seedSuperAdmin(): Promise<void> {
  const development = process.env.NODE_ENV !== "production";
  const email =
    process.env.ADMIN_EMAIL?.trim().toLowerCase() ||
    (development ? "admin@bdblood.local" : undefined);
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const fullName =
    process.env.ADMIN_FULL_NAME?.trim() ||
    (development ? "BD Blood Super Admin" : undefined);
  const bloodGroupName = process.env.ADMIN_BLOOD_GROUP?.trim() || "O+";

  if (!email || !fullName) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_FULL_NAME are required to seed the single Super Admin in production.",
    );
  }
  if (configuredPassword && configuredPassword.length < 12) {
    throw new Error("ADMIN_PASSWORD must contain at least 12 characters.");
  }
  const saltRounds = Number(process.env.BCRYPT_SALT_NUMBER || 12);
  if (!Number.isInteger(saltRounds) || saltRounds < 10) {
    throw new Error("BCRYPT_SALT_NUMBER must be an integer of at least 10.");
  }

  const existingAdmins = await prisma.donor.findMany({
    where: { role: Role.ADMIN, isDeleted: false },
    select: { id: true, email: true },
  });
  if (existingAdmins.length > 1) {
    throw new Error(
      `Expected exactly one active Super Admin, but found ${existingAdmins.length}. Resolve duplicate privileged accounts before seeding.`,
    );
  }
  let adminId: string;
  if (existingAdmins.length === 1) {
    if (existingAdmins[0].email.toLowerCase() !== email) {
      throw new Error(
        `An Admin already exists with a different email (${existingAdmins[0].email}). Refusing to create a second privileged account.`,
      );
    }
    adminId = existingAdmins[0].id;
    if (configuredPassword) {
      await prisma.donor.update({
        where: { id: adminId },
        data: {
          fullName,
          password: await bcrypt.hash(configuredPassword, saltRounds),
        },
      });
      console.log("Super Admin credentials synchronized from seed configuration.");
    }
  } else {
    const occupiedEmail = await prisma.donor.findUnique({ where: { email } });
    if (occupiedEmail) {
      throw new Error(
        "ADMIN_EMAIL belongs to an existing non-admin donor. Refusing an implicit privilege escalation.",
      );
    }

    const bloodGroup = await prisma.bloodGroup.findUnique({
      where: { groupName: bloodGroupName },
      select: { id: true },
    });
    if (!bloodGroup) {
      throw new Error(`Admin blood group ${bloodGroupName} is not seeded.`);
    }

    const password =
      configuredPassword ||
      (development ? randomBytes(24).toString("base64url") : undefined);
    if (!password) {
      throw new Error(
        "ADMIN_PASSWORD is required to create the Super Admin in production.",
      );
    }

    const admin = await prisma.donor.create({
      data: {
        fullName,
        email,
        password: await bcrypt.hash(password, saltRounds),
        bloodGroupId: bloodGroup.id,
        role: Role.ADMIN,
        isVerified: true,
        verifiedAt: new Date(),
      },
      select: { id: true },
    });
    adminId = admin.id;
    if (!configuredPassword) {
      console.warn(
        `Generated development Super Admin password (save it now): ${password}`,
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    const central = await tx.organization.findFirst({
      where: { level: "CENTRAL", canonical: true, isDeleted: false },
      select: { id: true },
    });
    if (!central) {
      throw new Error("Canonical Central organization must be seeded before the Super Admin.");
    }

    let position = await tx.organizationPosition.findFirst({
      where: { positionName: "Super Admin", isDeleted: false },
      select: { id: true },
    });
    if (!position) {
      position = await tx.organizationPosition.create({
        data: {
          positionName: "Super Admin",
          positionOrder: 0,
          level: PositionLevel.EXECUTIVE,
          positionStatus: PositionStatus.ACTIVE,
        },
        select: { id: true },
      });
    }

    await tx.organizationMember.upsert({
      where: { donorId: adminId },
      create: {
        donorId: adminId,
        organizationId: central.id,
        positionId: position.id,
        category: GovernanceCategory.COMMITTEE,
        seatKey: `${central.id}:COMMITTEE:${position.id}`,
        appointedById: adminId,
        status: OrganizationMemberStatus.ACTIVE,
        activatedAt: new Date(),
      },
      update: {
        organizationId: central.id,
        positionId: position.id,
        category: GovernanceCategory.COMMITTEE,
        seatKey: `${central.id}:COMMITTEE:${position.id}`,
        appointedById: adminId,
        status: OrganizationMemberStatus.ACTIVE,
        activatedAt: new Date(),
        endedAt: null,
        isDeleted: false,
        deletedAt: null,
      },
    });
  });
  console.log("Super Admin and National committee seat are ready.");
}
