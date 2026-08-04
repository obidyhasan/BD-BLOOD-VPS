import {
  AccountStatus,
  AvailabilityStatus,
  NotificationType,
} from "@prisma/client";
import { prisma } from "../shared/prisma";
import { smsHelper } from "./smsHelper";
import { emitDonorNotification } from "../shared/socket";
import { NotificationPriority } from "@prisma/client";

export const dispatchBloodRequestDonorAlerts = async (
  requestId: string,
): Promise<{ matched: number; notified: number; smsSent: number }> => {
  try {
    const request = await prisma.bloodRequest.findUnique({
      where: { id: requestId, isDeleted: false },
      include: {
        bloodGroup: true,
        upazila: true,
        district: true,
      },
    });
    if (!request) return { matched: 0, notified: 0, smsSent: 0 };

    const eligibleDonors = await prisma.donor.findMany({
      where: {
        isDeleted: false,
        isVerified: true,
        accountStatus: AccountStatus.ACTIVE,
        availabilityStatus: AvailabilityStatus.AVAILABLE,
        notifySms: true,
        bloodGroupId: request.bloodGroupId,
        districtId: request.districtId,
        upazilaId: request.upazilaId,
        phone: { not: null },
        role: "DONOR",
      },
      select: {
        id: true,
        phone: true,
        fullName: true,
        lastDonationDate: true,
        notifyInApp: true,
        notifySms: true,
      },
      take: 50,
    });

    // availabilityStatus (filtered above) is the single source of truth for
    // cooldown eligibility — it's flipped to UNAVAILABLE the moment a
    // donation is VERIFIED and back to AVAILABLE once nextEligibleDonationDate
    // (donationDate + 3 months) elapses (see donorAvailabilitySweeper.ts).
    // No further date filtering is needed here.
    const donors = eligibleDonors;

    let notified = 0;
    let smsSent = 0;

    // Each donor is handled independently and in parallel: previously this
    // loop was fully sequential (up to 50 donors x several awaited
    // round-trips each), which could take 15-25+ seconds for what's meant to
    // be an *urgent* alert, and any single unguarded failure (e.g. a unique
    // constraint race against a concurrent dispatch for the same request)
    // used to abort alerting for every donor still left in the loop.
    await Promise.allSettled(
      donors.map(async (donor) => {
        try {
          // Create-then-handle-conflict instead of check-then-create: avoids
          // a TOCTOU race if this function is ever invoked concurrently for
          // the same request (e.g. auto-dispatch overlapping an admin-
          // triggered rematch), relying on the existing
          // @@unique([requestId, donorId]) constraint.
          const alert = await prisma.bloodRequestDonorAlert.create({
            data: {
              requestId,
              donorId: donor.id,
              smsSent: false,
            },
          });

          if (donor.notifyInApp) {
            const notification = await prisma.notification.create({
              data: {
                donorId: donor.id,
                title: "Urgent Blood Request Nearby",
                message: `${request.bloodGroup?.groupName ?? "Blood"} needed at ${request.hospitalName}. Can you help?`,
                type: NotificationType.BLOOD_REQUEST,
                priority: NotificationPriority.HIGH,
                relatedId: requestId,
                relatedType: "BLOOD_REQUEST",
              },
            });
            emitDonorNotification(donor.id, notification);
            notified += 1;
          }

          if (donor.notifySms && donor.phone) {
            const result = await smsHelper.sendDonorBloodRequestAlertSms(
              donor.phone,
              {
                bloodGroup: request.bloodGroup?.groupName ?? "Blood",
                hospitalName: request.hospitalName,
                upazilaName: request.upazila?.name,
              },
            );
            if (result.success) {
              await prisma.bloodRequestDonorAlert.update({
                where: { id: alert.id },
                data: { smsSent: true },
              });
              smsSent += 1;
            }
          }
        } catch (error: any) {
          // P2002 = unique constraint violation on [requestId, donorId] —
          // this donor was already alerted (e.g. by a concurrent dispatch).
          // That's an expected, harmless outcome, not a failure to log.
          if (error?.code !== "P2002") {
            console.error(
              `[dispatchBloodRequestDonorAlerts] Failed for donor ${donor.id} (request ${requestId}):`,
              error,
            );
          }
        }
      }),
    );

    return { matched: donors.length, notified, smsSent };
  } catch (error) {
    console.error(
      `[dispatchBloodRequestDonorAlerts] Unexpected failure for request ${requestId}:`,
      error,
    );
    return { matched: 0, notified: 0, smsSent: 0 };
  }
};
