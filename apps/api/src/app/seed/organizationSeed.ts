import { createHash } from "crypto";
import {
  OrganizationLevel,
  OrganizationStatus,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "../shared/prisma";
import { GEO_ORGANIZATION_TYPES } from "../shared/geoOrganizationTypes";

const deterministicUuid = (scope: string) => {
  const hex = createHash("sha256")
    .update(`bd-blood-canonical-organization:${scope}`)
    .digest("hex")
    .slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20)}`;
};

const organizationPhone = () => {
  const phone = process.env.ORGANIZATION_SEED_PHONE?.trim();
  if (!phone) {
    throw new Error(
      "ORGANIZATION_SEED_PHONE is required to seed missing canonical organizations.",
    );
  }
  return phone;
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
    divisions.reduce((count, division) => count + division.districts.length, 0) +
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

  if (canonicalCount >= expectedCount) {
    console.log("⏭️  Canonical organization hierarchy already seeded — skipping.");
    return;
  }

  const phone = organizationPhone();
  let created = 0;

  let central = await prisma.organization.findFirst({
    where: {
      level: OrganizationLevel.CENTRAL,
      canonical: true,
      isDeleted: false,
    },
  });
  if (!central) {
    central = await prisma.organization.create({
      data: {
        id: deterministicUuid("CENTRAL"),
        name: "BD Blood National Organization",
        phone,
        address: "Bangladesh",
        divisionId: firstDivision.id,
        districtId: firstDistrict.id,
        upazilaId: firstUpazila.id,
        level: OrganizationLevel.CENTRAL,
        canonical: true,
        type: "Central Organization",
        description: "National coordination organization for the BD Blood network.",
        organizationStatus: OrganizationStatus.ACTIVE,
        verificationStatus: VerificationStatus.VERIFIED,
      },
    });
    created += 1;
  }

  for (const division of divisions) {
    const representativeDistrict = division.districts.find(
      (district) => district.upazilas.length > 0,
    );
    const representativeUpazila = representativeDistrict?.upazilas[0];
    if (!representativeDistrict || !representativeUpazila) continue;

    const divisionOrganization =
      (await prisma.organization.findFirst({
        where: {
          divisionId: division.id,
          level: OrganizationLevel.DIVISION,
          canonical: true,
          isDeleted: false,
        },
      })) ??
      (await prisma.organization.create({
        data: {
          id: deterministicUuid(`DIVISION:${division.id}`),
          name: `${division.name} Division Organization`,
          phone,
          address: `${division.name} Division, Bangladesh`,
          divisionId: division.id,
          districtId: representativeDistrict.id,
          upazilaId: representativeUpazila.id,
          level: OrganizationLevel.DIVISION,
          parentId: central.id,
          canonical: true,
          type: GEO_ORGANIZATION_TYPES.division,
          organizationStatus: OrganizationStatus.ACTIVE,
          verificationStatus: VerificationStatus.VERIFIED,
        },
      }));

    for (const district of division.districts) {
      const representativeDistrictUpazila = district.upazilas[0];
      if (!representativeDistrictUpazila) continue;

      const districtOrganization =
        (await prisma.organization.findFirst({
          where: {
            districtId: district.id,
            level: OrganizationLevel.DISTRICT,
            canonical: true,
            isDeleted: false,
          },
        })) ??
        (await prisma.organization.create({
          data: {
            id: deterministicUuid(`DISTRICT:${district.id}`),
            name: `${district.name} District Organization`,
            phone,
            address: `${district.name}, ${division.name}, Bangladesh`,
            divisionId: division.id,
            districtId: district.id,
            upazilaId: representativeDistrictUpazila.id,
            level: OrganizationLevel.DISTRICT,
            parentId: divisionOrganization.id,
            canonical: true,
            type: GEO_ORGANIZATION_TYPES.district,
            organizationStatus: OrganizationStatus.ACTIVE,
            verificationStatus: VerificationStatus.VERIFIED,
          },
        }));

      for (const upazila of district.upazilas) {
        const existing = await prisma.organization.findFirst({
          where: {
            upazilaId: upazila.id,
            level: OrganizationLevel.UPAZILA,
            canonical: true,
            isDeleted: false,
          },
          select: { id: true },
        });
        if (existing) continue;

        await prisma.organization.create({
          data: {
            id: deterministicUuid(`UPAZILA:${upazila.id}`),
            name: `${upazila.name} Upazila Organization`,
            phone,
            address: `${upazila.name}, ${district.name}, ${division.name}, Bangladesh`,
            divisionId: division.id,
            districtId: district.id,
            upazilaId: upazila.id,
            level: OrganizationLevel.UPAZILA,
            parentId: districtOrganization.id,
            canonical: true,
            type: GEO_ORGANIZATION_TYPES.upazila,
            organizationStatus: OrganizationStatus.ACTIVE,
            verificationStatus: VerificationStatus.VERIFIED,
          },
        });
        created += 1;
      }
    }
  }

  console.log(`✅ Canonical organization hierarchy ready (${created} missing nodes created).`);
};
