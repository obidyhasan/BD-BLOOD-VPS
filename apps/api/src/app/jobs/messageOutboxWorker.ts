import { MessageOutboxStatus, Prisma } from "@prisma/client";
import { smsHelper } from "../helper/smsHelper";
import { prisma } from "../shared/prisma";

const BATCH_SIZE = 20;
const MAX_ATTEMPTS = 5;
let running = false;

export const renderSms = (templateKey: string, payload: Prisma.JsonValue) => {
  const data = (payload ?? {}) as Record<string, unknown>;
  if (templateKey === "BLOOD_REQUEST_SUBMITTED_ORGANIZATION") {
    return [
      `BD Blood: New request ${String(data.referenceCode ?? "")}.`,
      `${String(data.bloodGroup ?? "N/A")} blood, ${String(data.requiredBags ?? 0)} bag(s),`,
      `${String(data.hospitalName ?? "N/A")}, ${String(data.upazila ?? "N/A")}.`,
      `Requester: ${String(data.requesterName ?? "N/A")}. Open the dashboard to review it.`,
    ]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }
  if (templateKey === "BLOOD_REQUEST_MANUAL_REQUESTER") {
    const message = typeof data.message === "string" ? data.message.trim() : "";
    if (!message) throw new Error("Manual requester SMS message is empty");
    return `BD Blood [${String(data.referenceCode ?? "")}]: ${message}`;
  }
  if (templateKey === "BLOOD_REQUEST_FULFILLED_REQUESTER") {
    const location = [data.upazila, data.district, data.division]
      .filter((value) => typeof value === "string" && value.trim())
      .join(", ");
    const representative = [data.representativeName, data.representativePhone]
      .filter((value) => typeof value === "string" && value.trim())
      .join(" - ");
    const patientInformation =
      typeof data.patientInformation === "string" &&
      data.patientInformation.trim()
        ? ` Patient/request: ${data.patientInformation.trim()}.`
        : "";
    const contact = representative
      ? ` Contact: ${representative}.`
      : " Our representative will contact you shortly.";

    return [
      `BD Blood: Request ${String(data.referenceCode ?? "")} is fully fulfilled.`,
      `Blood: ${String(data.bloodGroup ?? "N/A")}; bags: ${String(data.fulfilledBags ?? 0)}/${String(data.requiredBags ?? 0)}.`,
      `Location: ${location || "N/A"}; hospital: ${String(data.hospitalName ?? "N/A")}.`,
      `${patientInformation}${contact}`,
      "Your blood has been arranged successfully.",
    ]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }
  throw new Error(`Unsupported SMS outbox template: ${templateKey}`);
};
const nextRetry = (attempts: number) =>
  new Date(
    Date.now() + Math.min(60_000 * 2 ** Math.max(attempts - 1, 0), 60 * 60_000),
  );

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
            status: dead
              ? MessageOutboxStatus.DEAD
              : MessageOutboxStatus.FAILED,
            nextAttemptAt: nextRetry(event.attempts),
            lastError:
              error instanceof Error
                ? error.message.slice(0, 1_000)
                : "Unknown outbox error",
          },
        });
      }
    }
  } finally {
    running = false;
  }
};
