import { AvailabilityStatus } from "@prisma/client";
import { prisma } from "../shared/prisma";

const SWEEP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

async function sweepDonorAvailability() {
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

let sweepTimer: NodeJS.Timeout | null = null;

/**
 * Backend/DB-driven safety net that keeps Donor.availabilityStatus in sync
 * with Donor.nextEligibleDonationDate: verifyDonation() sets a donor
 * UNAVAILABLE with a nextEligibleDonationDate (donationDate + 3 months)
 * the moment a donation is VERIFIED, but nothing else ever flips that flag
 * back once the cooldown period elapses. Every donor-matching query in the
 * app (donor search, request assignment, donor alerts, analytics, blood
 * inventory) filters directly on availabilityStatus, so if this never ran,
 * donors would stay permanently excluded from matching after their first
 * donation.
 *
 * This intentionally reuses updateMany (an idempotent, conditional bulk
 * update) rather than introducing a new queue/worker dependency, mirroring
 * notificationSweeper.ts's in-process interval approach. There's no
 * per-sweep row cap (Postgres UPDATE has no LIMIT support), but that's
 * fine: this only ever touches donors whose cooldown has already elapsed,
 * so a larger batch just means the sweep does more useful work, not more
 * risk.
 */
export function startDonorAvailabilitySweeper() {
  if (sweepTimer) return;
  sweepTimer = setInterval(sweepDonorAvailability, SWEEP_INTERVAL_MS);
  sweepTimer.unref?.();
}
