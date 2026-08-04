-- CreateEnum
CREATE TYPE "RequestAssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "BloodRequests"
  ADD COLUMN "organizationId" TEXT,
  ADD COLUMN "confirmedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "cancelledById" TEXT;

-- CreateTable
CREATE TABLE "requestAssignments" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "status" "RequestAssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "assignedById" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "requestAssignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloodRequestStatusHistory" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "previousStatus" "BloodRequestStatus",
    "newStatus" "BloodRequestStatus" NOT NULL,
    "changedById" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloodRequestStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "requestAssignments_requestId_donorId_key" ON "requestAssignments"("requestId", "donorId");
CREATE INDEX "requestAssignments_requestId_idx" ON "requestAssignments"("requestId");
CREATE INDEX "requestAssignments_donorId_idx" ON "requestAssignments"("donorId");
CREATE INDEX "requestAssignments_status_idx" ON "requestAssignments"("status");
CREATE INDEX "bloodRequestStatusHistory_requestId_idx" ON "bloodRequestStatusHistory"("requestId");
CREATE INDEX "bloodRequestStatusHistory_changedById_idx" ON "bloodRequestStatusHistory"("changedById");
CREATE INDEX "BloodRequests_organizationId_idx" ON "BloodRequests"("organizationId");

-- AddForeignKey
ALTER TABLE "BloodRequests" ADD CONSTRAINT "BloodRequests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BloodRequests" ADD CONSTRAINT "BloodRequests_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "requestAssignments" ADD CONSTRAINT "requestAssignments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "requestAssignments" ADD CONSTRAINT "requestAssignments_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "requestAssignments" ADD CONSTRAINT "requestAssignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "donors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bloodRequestStatusHistory" ADD CONSTRAINT "bloodRequestStatusHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bloodRequestStatusHistory" ADD CONSTRAINT "bloodRequestStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;