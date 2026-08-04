import { prisma } from "../shared/prisma";
import { smsHelper } from "./smsHelper";

/**
 * Fire-and-forget from the request handler (`void dispatchBloodRequestSms(...)`),
 * so this function must never let a rejection escape — an uncaught rejection
 * here would become an unhandled promise rejection at the process level.
 * Every await is therefore individually isolated with try/catch and failures
 * are logged (previously swallowed silently, which made stuck
 * `smsSent: false` rows undiagnosable).
 */
export const dispatchBloodRequestSms = async (
  requestId: string,
): Promise<void> => {
  try {
    const request = await prisma.bloodRequest.findUnique({
      where: { id: requestId, isDeleted: false },
      include: { bloodGroup: true },
    });
    if (!request) return;

    const pending = await prisma.bloodRequestNotification.findMany({
      where: { requestId, smsSent: false, isDeleted: false },
      include: { organization: { select: { phone: true, name: true } } },
    });

    // Isolate + parallelize: one organization's failure (bad number, gateway
    // hiccup) must not block or delay SMS delivery to the others.
    await Promise.allSettled(
      pending.map(async (notification) => {
        const phone = notification.organization?.phone;
        if (!phone) return;

        try {
          const result = await smsHelper.sendBloodRequestAlertSms(phone, {
            requesterName: request.requesterName,
            bloodGroup: request.bloodGroup?.groupName ?? "Blood",
            hospitalName: request.hospitalName,
          });
          if (result.success) {
            await prisma.bloodRequestNotification.update({
              where: { id: notification.id },
              data: { smsSent: true },
            });
          }
        } catch (error) {
          // Non-blocking: SMS/DB failures must not break request flow,
          // but they must be visible for ops to notice stuck notifications.
          console.error(
            `[dispatchBloodRequestSms] Failed for notification ${notification.id} (request ${requestId}):`,
            error,
          );
        }
      }),
    );
  } catch (error) {
    console.error(
      `[dispatchBloodRequestSms] Unexpected failure for request ${requestId}:`,
      error,
    );
  }
};
