CREATE TABLE "public_request_idempotency" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_request_idempotency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "public_request_idempotency_key_key"
ON "public_request_idempotency"("key");

CREATE UNIQUE INDEX "public_request_idempotency_requestId_key"
ON "public_request_idempotency"("requestId");

CREATE INDEX "public_request_idempotency_expiresAt_idx"
ON "public_request_idempotency"("expiresAt");

ALTER TABLE "public_request_idempotency"
ADD CONSTRAINT "public_request_idempotency_requestId_fkey"
FOREIGN KEY ("requestId") REFERENCES "BloodRequests"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
