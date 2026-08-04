import { MessageOutboxStatus, Prisma } from "@prisma/client";
import { smsHelper } from "../helper/smsHelper";
import { prisma } from "../shared/prisma";

const POLL_INTERVAL_MS = 5_000;
const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 5;
let running = false;

const renderSms = (templateKey: string, payload: Prisma.JsonValue) => {
  const data = (payload ?? {}) as Record<string, unknown>;
  if (templateKey === "BLOOD_REQUEST_FULFILLED_REQUESTER") {
    return `BD Blood: Your blood request ${String(data.referenceCode ?? "")} at ${String(data.hospitalName ?? "the hospital")} has been fulfilled.`;
  }
  throw new Error(`Unsupported SMS outbox template: ${templateKey}`);
};

const nextRetry = (attempts: number) =>
  new Date(Date.now() + Math.min(60_000 * 2 ** Math.max(attempts - 1, 0), 60 * 60_000));

export const processMessageOutbox = async () => {
  if (running) return;
  running = true;
  try {
    const events = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM "message_outbox"
        WHERE channel = 'SMS'::"MessageChannel"
          AND status IN ('PENDING'::"MessageOutboxStatus", 'FAILED'::"MessageOutboxStatus")
          AND "nextAttemptAt" <= NOW()
        ORDER BY "createdAt" ASC
        LIMIT ${BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      `;
      if (!rows.length) return [];
      return Promise.all(
        rows.map((row) =>
          tx.messageOutbox.update({
            where: { id: row.id },
            data: {
              status: MessageOutboxStatus.PROCESSING,
              attempts: { increment: 1 },
            },
          }),
        ),
      );
    });

    for (const event of events) {
      try {
        const message = renderSms(event.templateKey, event.payload);
        const result = await smsHelper.sendSMS(event.recipient, message);
        if (!result.success) throw new Error(result.message);
        await prisma.messageOutbox.update({
          where: { id: event.id },
          data: {
            status: MessageOutboxStatus.SENT,
            sentAt: new Date(),
            lastError: null,
          },
        });
      } catch (error) {
        const dead = event.attempts >= MAX_ATTEMPTS;
        await prisma.messageOutbox.update({
          where: { id: event.id },
          data: {
            status: dead ? MessageOutboxStatus.DEAD : MessageOutboxStatus.FAILED,
            nextAttemptAt: nextRetry(event.attempts),
            lastError: error instanceof Error ? error.message.slice(0, 1_000) : "Unknown outbox error",
          },
        });
      }
    }
  } finally {
    running = false;
  }
};

export const startMessageOutboxWorker = () => {
  const timer = setInterval(() => {
    void processMessageOutbox().catch((error) =>
      console.error("[messageOutboxWorker] Sweep failed:", error),
    );
  }, POLL_INTERVAL_MS);
  timer.unref();
  void processMessageOutbox().catch((error) =>
    console.error("[messageOutboxWorker] Initial sweep failed:", error),
  );
};
