import "dotenv/config";
import { GovernanceCategory, OrganizationLevel, OrganizationMemberStatus } from "@prisma/client";
import { prisma } from "../shared/prisma";

const fail = (message: string): never => { throw new Error(`Public/Admin audit failed: ${message}`); };

async function roster(organizationId: string) {
  const rows = await prisma.organizationMember.groupBy({
    by: ["category"],
    where: { organizationId, status: OrganizationMemberStatus.ACTIVE, isDeleted: false },
    _count: true,
  });
  return {
    committee: rows.find((row) => row.category === GovernanceCategory.COMMITTEE)?._count ?? 0,
    advisors: rows.find((row) => row.category === GovernanceCategory.ADVISOR)?._count ?? 0,
  };
}

async function run() {
  const central = await prisma.organization.findFirstOrThrow({ where: { canonical: true, level: OrganizationLevel.CENTRAL, isDeleted: false } });
  const root = await roster(central.id);
  if (root.committee !== 11 || root.advisors !== 11) fail(`Central roster is ${root.committee}+${root.advisors}, expected 11+11`);

  const governed = await prisma.organization.findMany({
    where: { canonical: true, isDeleted: false, members: { some: { status: OrganizationMemberStatus.ACTIVE, isDeleted: false } } },
    select: { id: true, level: true, name: true, upazilaId: true },
  });
  const summaries = [];
  for (const organization of governed) {
    const counts = await roster(organization.id);
    if (counts.committee > 11 || counts.advisors > 11) fail(`${organization.name} exceeds the 11-seat cap`);
    if (organization.level === OrganizationLevel.UPAZILA && counts.advisors) fail(`${organization.name} has prohibited Upazila advisors`);
    summaries.push({ level: organization.level, name: organization.name, ...counts });
  }

  const sampleUpazila = governed.find((organization) => organization.level === OrganizationLevel.UPAZILA);
  if (sampleUpazila === undefined) throw new Error("Public/Admin audit failed: no governed Upazila organization exists");
  const resolved = await prisma.organization.findFirst({ where: { upazilaId: sampleUpazila.upazilaId, level: OrganizationLevel.UPAZILA, canonical: true, organizationStatus: "ACTIVE", verificationStatus: "VERIFIED", isDeleted: false } });
  if (resolved?.id !== sampleUpazila.id) fail("Upazila-to-public-organization resolution is inconsistent");

  const moderation = {
    blogs: await prisma.blog.count({ where: { organizationId: { not: null }, status: "PENDING", isDeleted: false } }),
    events: await prisma.event.count({ where: { organizationId: { not: "" }, approvalStatus: "PENDING", isDeleted: false } }),
    galleries: await prisma.gallery.count({ where: { organizationId: { not: null }, approvalStatus: "PENDING", isDeleted: false } }),
  };
  console.table(summaries);
  console.log("Public organization and Super Admin data audit passed", { root, governedScopes: summaries.length, moderation });
}

run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
