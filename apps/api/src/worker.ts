import "dotenv/config";

import { sweepDonorAvailability } from "./app/jobs/donorAvailabilitySweeper";
import { processMessageOutbox } from "./app/jobs/messageOutboxWorker";
import { prisma } from "./app/shared/prisma";

const OUTBOX_INTERVAL_MS = 5_000;
const COOLDOWN_INTERVAL_MS = 10 * 60 * 1_000;

let shuttingDown = false;
const inFlight = new Set<Promise<void>>();

const runSafely = async (name: string, job: () => Promise<void>) => {
  try {
    await job();
  } catch (error) {
    console.error(`[worker] ${name} failed:`, error);
  }
};

const schedule = (name: string, job: () => Promise<void>) => {
  if (shuttingDown) return;
  const task = runSafely(name, job).finally(() => inFlight.delete(task));
  inFlight.add(task);
};

const outboxTimer = setInterval(() => {
  schedule("message outbox", processMessageOutbox);
}, OUTBOX_INTERVAL_MS);

const cooldownTimer = setInterval(() => {
  schedule("donor cooldown", sweepDonorAvailability);
}, COOLDOWN_INTERVAL_MS);

schedule("initial message outbox", processMessageOutbox);
schedule("initial donor cooldown", sweepDonorAvailability);
console.log("BD Blood background worker started.");

const shutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[worker] ${signal} received; shutting down.`);
  clearInterval(outboxTimer);
  clearInterval(cooldownTimer);
  await Promise.allSettled([...inFlight]);
  await prisma.$disconnect().catch((error) =>
    console.error("[worker] Prisma disconnect failed:", error),
  );
  process.exit(0);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("unhandledRejection", (error) => {
  console.error("[worker] Unhandled rejection:", error);
  void shutdown("unhandledRejection");
});
