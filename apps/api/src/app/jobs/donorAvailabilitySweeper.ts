import { AvailabilityStatus } from "@prisma/client";
import { prisma } from "../shared/prisma";

export async function sweepDonorAvailability() {
  try {
    const now = new Date();

    // Only donors currently UNAVAILABLE with a cooldown that has passed are
    // touched. This is a plain conditional UPDATE, so it's safe to run
    // repeatedly / concurrently with request-handling code: a donor who
    // gets marked UNAVAILABLE again in between sweeps (a new VERIFIED
    // donation) simply won't match the where clause until their new
    // nextEligibleDonationDate has also passed.
    const { count } = await prisma.donor.updateMany({
      where: {
        isDeleted: false,
        availabilityStatus: AvailabilityStatus.UNAVAILABLE,
        nextEligibleDonationDate: { not: null, lte: now },
      },
      data: {
        availabilityStatus: AvailabilityStatus.AVAILABLE,
      },
    });

    if (count > 0) {
      console.log(
        `[donorAvailabilitySweeper] Restored ${count} donor(s) to AVAILABLE after their cooldown elapsed`,
      );
    }
  } catch (error) {
    console.error("[donorAvailabilitySweeper] Sweep failed:", error);
  }
}
