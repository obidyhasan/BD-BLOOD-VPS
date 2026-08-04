import { MessageChannel, Prisma } from "@prisma/client";

export type OutboxClient = Pick<Prisma.TransactionClient, "messageOutbox">;

export const enqueueOutboxEvent = async (
  tx: OutboxClient,
  event: {
    channel: MessageChannel;
    templateKey: string;
    recipient: string;
    payload: Prisma.InputJsonValue;
    aggregateType: string;
    aggregateId: string;
    eventKey: string;
  },
) =>
  tx.messageOutbox.upsert({
    where: { eventKey: event.eventKey },
    create: event,
    update: {},
  });

export const requestEventKey = (
  requestId: string,
  event: string,
  recipientKey: string,
) => `blood-request:${requestId}:${event}:${recipientKey}`;
