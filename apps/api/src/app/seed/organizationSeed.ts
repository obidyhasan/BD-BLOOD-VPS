import { createHash } from "crypto";
import {
  OrganizationLevel,
  OrganizationStatus,
  Prisma,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "../shared/prisma";

const deterministicUuid = (scope: string) => {
  const hex = createHash("sha256")
    .update(`bd-blood-canonical-organization:${scope}`)
    .digest("hex")
    .slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20)}`;
};

const organizationPhone = () => {
  const phone = process.env.ORGANIZATION_SEED_PHONE?.trim();
  if (phone) return phone;
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "ORGANIZATION_SEED_PHONE is unset; using the development-only placeholder +8801000000000.",
    );
    return "+8801000000000";
  }
  throw new Error(
    "ORGANIZATION_SEED_PHONE is required to seed missing canonical organizations in production.",
  );
};

export const seedCanonicalOrganizations = async () => {
  const divisions = await prisma.division.findMany({
    where: { isDeleted: false },
    orderBy: { name: "asc" },
    include: {
      districts: {
        where: { isDeleted: false },
        orderBy: { name: "asc" },
        include: {
          upazilas: {
            where: { isDeleted: false },
            orderBy: { name: "asc" },
          },
        },
      },
    },
  });

  const firstDivision = divisions.find((division) =>
    division.districts.some((district) => district.upazilas.length > 0),
  );
  const firstDistrict = firstDivision?.districts.find(
    (district) => district.upazilas.length > 0,
  );
  const firstUpazila = firstDistrict?.upazilas[0];

  if (!firstDivision || !firstDistrict || !firstUpazila) {
    throw new Error(
      "Canonical organizations require seeded Division, District, and Upazila geography.",
    );
  }

  const expectedCount =
    1 +
    divisions.length +
    divisions.reduce(
      (count, division) => count + division.districts.length,
      0,
    ) +
    divisions.reduce(
      (count, division) =>
        count +
        division.districts.reduce(
          (districtCount, district) => districtCount + district.upazilas.length,
          0,
        ),
      0,
    );
  const canonicalCount = await prisma.organization.count({
    where: { canonical: true, isDeleted: false },
  });

  console.log(
    `Verifying ${expectedCount} canonical organization nodes (${canonicalCount} currently active).`,
  );

  const phone = organizationPhone();
  const existing = await prisma.organization.findMany({
    where: { canonical: true, isDeleted: false },
    select: {
      id: true,
      level: true,
      divisionId: true,
      districtId: true,
      upazilaId: true,
    },
  });
  const existingCentral = existing.find(
    (item) => item.level === OrganizationLevel.CENTRAL,
  );
  const existingDivisionByGeo = new Map(
    existing
      .filter((item) => item.level === OrganizationLevel.DIVISION)
      .map((item) => [item.divisionId, item.id]),
  );
  const existingDistrictByGeo = new Map(
    existing
      .filter((item) => item.level === OrganizationLevel.DISTRICT)
      .map((item) => [item.districtId, item.id]),
  );
  const existingUpazilaIds = new Set(
    existing
      .filter((item) => item.level === OrganizationLevel.UPAZILA)
      .map((item) => item.upazilaId),
  );

  const centralId = existingCentral?.id ?? deterministicUuid("CENTRAL");
  const centralRows: Prisma.OrganizationCreateManyInput[] = existingCentral
    ? []
    : [
        {
          id: centralId,
          name: "BD Blood National Organization",
          phone,
          address: "Bangladesh",
          divisionId: firstDivision.id,
          districtId: firstDistrict.id,
          upazilaId: firstUpazila.id,
          level: OrganizationLevel.CENTRAL,
          canonical: true,
          description:
            "National coordination organization for the BD Blood network.",
          organizationStatus: OrganizationStatus.ACTIVE,
          verificationStatus: VerificationStatus.VERIFIED,
        },
      ];
  const divisionRows: Prisma.OrganizationCreateManyInput[] = [];
  const districtRows: Prisma.OrganizationCreateManyInput[] = [];
  const upazilaRows: Prisma.OrganizationCreateManyInput[] = [];

  for (const division of divisions) {
    const representativeDistrict = division.districts.find(
      (district) => district.upazilas.length > 0,
    );
    const representativeUpazila = representativeDistrict?.upazilas[0];
    if (!representativeDistrict || !representativeUpazila) continue;

    const divisionOrganizationId =
      existingDivisionByGeo.get(division.id) ??
      deterministicUuid(`DIVISION:${division.id}`);
    if (!existingDivisionByGeo.has(division.id)) {
      divisionRows.push({
        id: divisionOrganizationId,
        name: `${division.name} Division Organization`,
        phone,
        address: `${division.name} Division, Bangladesh`,
        divisionId: division.id,
        districtId: representativeDistrict.id,
        upazilaId: representativeUpazila.id,
        level: OrganizationLevel.DIVISION,
        parentId: centralId,
        canonical: true,
        organizationStatus: OrganizationStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
      });
    }

    for (const district of division.districts) {
      const representativeDistrictUpazila = district.upazilas[0];
      if (!representativeDistrictUpazila) continue;
      const districtOrganizationId =
        existingDistrictByGeo.get(district.id) ??
        deterministicUuid(`DISTRICT:${district.id}`);
      if (!existingDistrictByGeo.has(district.id)) {
        districtRows.push({
          id: districtOrganizationId,
          name: `${district.name} District Organization`,
          phone,
          address: `${district.name}, ${division.name}, Bangladesh`,
          divisionId: division.id,
          districtId: district.id,
          upazilaId: representativeDistrictUpazila.id,
          level: OrganizationLevel.DISTRICT,
          parentId: divisionOrganizationId,
          canonical: true,
          organizationStatus: OrganizationStatus.ACTIVE,
          verificationStatus: VerificationStatus.VERIFIED,
        });
      }

      for (const upazila of district.upazilas) {
        if (existingUpazilaIds.has(upazila.id)) continue;
        upazilaRows.push({
          id: deterministicUuid(`UPAZILA:${upazila.id}`),
          name: `${upazila.name} Upazila Organization`,
          phone,
          address: `${upazila.name}, ${district.name}, ${division.name}, Bangladesh`,
          divisionId: division.id,
          districtId: district.id,
          upazilaId: upazila.id,
          level: OrganizationLevel.UPAZILA,
          parentId: districtOrganizationId,
          canonical: true,
          organizationStatus: OrganizationStatus.ACTIVE,
          verificationStatus: VerificationStatus.VERIFIED,
        });
      }
    }
  }

  await prisma.$transaction(
    async (tx) => {
      if (centralRows.length)
        await tx.organization.createMany({ data: centralRows });
      if (divisionRows.length)
        await tx.organization.createMany({ data: divisionRows });
      if (districtRows.length)
        await tx.organization.createMany({ data: districtRows });
      if (upazilaRows.length)
        await tx.organization.createMany({ data: upazilaRows });
    },
    { maxWait: 10_000, timeout: 120_000 },
  );

  const seededUpazilas = divisions.flatMap((division) =>
    division.districts.flatMap((district) => district.upazilas),
  );
  const organizations = await prisma.organization.findMany({
    where: {
      level: OrganizationLevel.UPAZILA,
      canonical: true,
      isDeleted: false,
      upazilaId: { in: seededUpazilas.map((upazila) => upazila.id) },
    },
    select: {
      id: true,
      divisionId: true,
      districtId: true,
      upazilaId: true,
      upazila: {
        select: {
          districtId: true,
          district: { select: { divisionId: true } },
        },
      },
    },
  });
  const organizationsByUpazila = new Map<string, typeof organizations>();
  for (const organization of organizations) {
    const rows = organizationsByUpazila.get(organization.upazilaId) ?? [];
    rows.push(organization);
    organizationsByUpazila.set(organization.upazilaId, rows);
  }
  const divisionByDistrict = new Map(
    divisions.flatMap((division) =>
      division.districts.map((district) => [district.id, division.id] as const),
    ),
  );
  const invalidMappings = seededUpazilas.filter((upazila) => {
    const rows = organizationsByUpazila.get(upazila.id) ?? [];
    const organization = rows[0];
    return (
      rows.length !== 1 ||
      organization?.districtId !== upazila.districtId ||
      organization?.divisionId !== divisionByDistrict.get(upazila.districtId) ||
      organization?.upazila.districtId !== upazila.districtId ||
      organization?.upazila.district.divisionId !== organization.divisionId
    );
  });
  if (invalidMappings.length) {
    throw new Error(
      `Canonical Upazila organization verification failed for ${invalidMappings.length} seeded Upazila(s).`,
    );
  }

  const created =
    centralRows.length +
    divisionRows.length +
    districtRows.length +
    upazilaRows.length;
  console.log(
    `✅ Canonical organization hierarchy ready (${created} missing nodes created).`,
  );
};
