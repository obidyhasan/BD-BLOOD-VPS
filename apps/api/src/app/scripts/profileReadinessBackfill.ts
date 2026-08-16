import { DonorProfileStatus } from "@prisma/client";
import { prisma } from "../shared/prisma";
import { resolveDonorAffiliation } from "../shared/donorAffiliation";
import {
  calculateProfileReadiness,
  ProfileFacts,
} from "../shared/profileReadiness";

const apply = process.argv.includes("--apply");

type ReviewItem = {
  donorId: string;
  code: string;
  detail: string;
};

const main = async () => {
  const donors = await prisma.donor.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      fullName: true,
      phone: true,
      phoneVerifiedAt: true,
      profilePhoto: true,
      bio: true,
      isVerified: true,
      bloodGroupId: true,
      divisionId: true,
      districtId: true,
      upazilaId: true,
      accountStatus: true,
      availabilityStatus: true,
      nextEligibleDonationDate: true,
      profileStatus: true,
      profileCompletedAt: true,
      division: { select: { id: true, isDeleted: true } },
      district: { select: { id: true, divisionId: true, isDeleted: true } },
      upazila: { select: { id: true, districtId: true, isDeleted: true } },
    },
  });

  const plans: Array<{
    donorId: string;
    status: DonorProfileStatus;
    profileCompletedAt: Date | null;
  }> = [];
  const review: ReviewItem[] = [];

  for (const donor of donors) {
    const geographyValid = Boolean(
      donor.divisionId &&
        donor.districtId &&
        donor.upazilaId &&
        donor.division &&
        !donor.division.isDeleted &&
        donor.district &&
        !donor.district.isDeleted &&
        donor.district.divisionId === donor.divisionId &&
        donor.upazila &&
        !donor.upazila.isDeleted &&
        donor.upazila.districtId === donor.districtId,
    );
    const affiliation = await resolveDonorAffiliation(prisma, donor.id);
    const facts: ProfileFacts = {
      fullName: donor.fullName,
      phone: donor.phone,
      emailVerified: donor.isVerified,
      phoneVerified: Boolean(donor.phoneVerifiedAt),
      profilePhoto: donor.profilePhoto,
      bio: donor.bio,
      bloodGroupId: donor.bloodGroupId,
      divisionId: donor.divisionId,
      districtId: donor.districtId,
      upazilaId: donor.upazilaId,
      geographyValid,
      affiliationActive: Boolean(affiliation),
      accountActive: donor.accountStatus === "ACTIVE",
      availabilityAvailable: donor.availabilityStatus === "AVAILABLE",
      nextEligibleDonationDate: donor.nextEligibleDonationDate,
    };
    const readiness = calculateProfileReadiness(facts);

    if (!geographyValid && donor.divisionId && donor.districtId && donor.upazilaId) {
      review.push({
        donorId: donor.id,
        code: "INVALID_GEOGRAPHIC_ANCESTRY",
        detail: "Division, District, and Upazila IDs do not form a valid active ancestry chain.",
      });
    }
    if (!affiliation && donor.upazilaId) {
      review.push({
        donorId: donor.id,
        code: "MISSING_AFFILIATION",
        detail: "No active new affiliation or legacy Normal Donor membership could be resolved.",
      });
    }

    plans.push({
      donorId: donor.id,
      status: readiness.status,
      profileCompletedAt:
        readiness.status === DonorProfileStatus.COMPLETE
          ? (donor.profileCompletedAt ?? readiness.completedAt)
          : null,
    });
  }

  if (apply) {
    await prisma.$transaction(async (tx) => {
      for (const plan of plans) {
        await tx.donor.update({
          where: { id: plan.donorId },
          data: {
            profileStatus: plan.status,
            profileCompletedAt: plan.profileCompletedAt,
          },
        });
      }
    });
  }

  const output = {
    mode: apply ? "APPLY" : "DRY_RUN",
    summary: {
      donorsScanned: donors.length,
      complete: plans.filter((plan) => plan.status === DonorProfileStatus.COMPLETE).length,
      incomplete: plans.filter((plan) => plan.status === DonorProfileStatus.INCOMPLETE).length,
      reviewItems: review.length,
    },
    review,
  };
  console.log(JSON.stringify(output, null, 2));
  if (!apply) console.error("Dry run only. Re-run with --apply after reviewing the report.");
};

main()
  .catch((error) => {
    console.error("Phase 3 profile readiness backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
