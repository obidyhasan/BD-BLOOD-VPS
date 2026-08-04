import { BloodRequestStatus } from "@prisma/client";
import { prisma } from "../shared/prisma";
import { dispatchBloodRequestSms } from "../helper/bloodRequestSms";
import { dispatchBloodRequestDonorAlerts } from "../helper/bloodRequestDonorAlert";

const SWEEP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const LOOKBACK_HOURS = 48;
const MAX_REQUESTS_PER_SWEEP = 25;

const RESOLVED_STATUSES: BloodRequestStatus[] = [
  BloodRequestStatus.FULFILLED,
  BloodRequestStatus.CANCELLED,
  BloodRequestStatus.REJECTED,
];

async function sweepUnsentNotifications() {
  try {
    const since = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000);

    const staleRequests = await prisma.bloodRequest.findMany({
      where: {
        isDeleted: false,
        createdAt: { gte: since },
        status: { notIn: RESOLVED_STATUSES },
        notifications: { some: { smsSent: false, isDeleted: false } },
      },
      select: { id: true },
      take: MAX_REQUESTS_PER_SWEEP,
    });

    if (!staleRequests.length) return;

    console.log(
      `[notificationSweeper] Retrying ${staleRequests.length} request(s) with unsent notifications`,
    );

    // Sequential on purpose: this is a background safety net, not a
    // latency-sensitive path, so there's no reason to burst-load the SMS
    // gateway or the DB connection pool.
    for (const { id } of staleRequests) {
      await dispatchBloodRequestSms(id).catch((error) =>
        console.error(
          `[notificationSweeper] dispatchBloodRequestSms retry failed for ${id}:`,
          error,
        ),
      );
      await dispatchBloodRequestDonorAlerts(id).catch((error) =>
        console.error(
          `[notificationSweeper] dispatchBloodRequestDonorAlerts retry failed for ${id}:`,
          error,
        ),
      );
    }
  } catch (error) {
    console.error("[notificationSweeper] Sweep failed:", error);
  }
}

let sweepTimer: NodeJS.Timeout | null = null;

/**
 * Durability safety net for the fire-and-forget notification pipeline
 * (see dispatchBloodRequestSms / dispatchBloodRequestDonorAlerts): those run
 * unawaited from the request handler, so if the process restarted, or a
 * serverless invocation was frozen/recycled mid-dispatch, some
 * organizations or donors may never have been notified about a still-active
 * request. This periodically retries any non-resolved request from the
 * last 48 hours that still has at least one unsent organization
 * notification. Both dispatch functions are idempotent — they only touch
 * `smsSent: false` rows, and donor alerting relies on a unique constraint
 * to silently skip donors who were already alerted — so retrying is always
 * safe and never re-sends a notification that already went out.
 *
 * This intentionally doesn't introduce a new queue/worker dependency: it's
 * a lightweight in-process safety net, not a replacement for a real job
 * queue if this system's notification volume grows enough to need one.
 */
export function startNotificationSweeper() {
  if (sweepTimer) return;
  sweepTimer = setInterval(sweepUnsentNotifications, SWEEP_INTERVAL_MS);
  sweepTimer.unref?.();
}
