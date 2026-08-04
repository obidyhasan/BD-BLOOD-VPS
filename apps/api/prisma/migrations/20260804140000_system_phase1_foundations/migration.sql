-- Phase 1: additive foundations for canonical geography, donor affiliation,
-- request fulfillment, governance metadata, donation posts, and durable messaging.
-- Legacy statuses, membership cardinality, and organization geography remain
-- available until their dedicated backfill/cutover migrations.

-- Extend legacy enums without removing values used by the running application.
ALTER TYPE "BloodRequestStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "BloodRequestStatus" ADD VALUE IF NOT EXISTS 'DONOR_FOUND';
ALTER TYPE "BloodRequestStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';

ALTER TYPE "RequestAssignmentStatus" ADD VALUE IF NOT EXISTS 'NOTIFIED';
ALTER TYPE "RequestAssignmentStatus" ADD VALUE IF NOT EXISTS 'DECLINED';
ALTER TYPE "RequestAssignmentStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';
ALTER TYPE "RequestAssignmentStatus" ADD VALUE IF NOT EXISTS 'DONATION_PENDING';
ALTER TYPE "RequestAssignmentStatus" ADD VALUE IF NOT EXISTS 'DONATED';

CREATE TYPE "OrganizationLevel" AS ENUM ('CENTRAL', 'DIVISION', 'DISTRICT', 'UPAZILA');
CREATE TYPE "AffiliationSource" AS ENUM ('PROFILE', 'ADMIN', 'MIGRATION');
CREATE TYPE "GovernanceCategory" AS ENUM ('COMMITTEE', 'ADVISOR');
CREATE TYPE "DonorProfileStatus" AS ENUM ('INCOMPLETE', 'COMPLETE');
CREATE TYPE "MessageChannel" AS ENUM ('SMS', 'IN_APP', 'EMAIL');
CREATE TYPE "MessageOutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'DEAD');

-- Donor profile readiness is intentionally conservative until affiliation is backfilled.
ALTER TABLE "donors"
  ADD COLUMN "profileStatus" "DonorProfileStatus" NOT NULL DEFAULT 'INCOMPLETE',
  ADD COLUMN "profileCompletedAt" TIMESTAMP(3);

CREATE INDEX "donors_profileStatus_idx" ON "donors"("profileStatus");

-- Existing organizations remain non-canonical until the anomaly report is reviewed.
ALTER TABLE "organizations"
  ADD COLUMN "level" "OrganizationLevel" NOT NULL DEFAULT 'UPAZILA',
  ADD COLUMN "parentId" TEXT,
  ADD COLUMN "canonical" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "organizations"
  ADD CONSTRAINT "organizations_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "organizations_level_idx" ON "organizations"("level");
CREATE INDEX "organizations_parentId_idx" ON "organizations"("parentId");
CREATE INDEX "organizations_canonical_idx" ON "organizations"("canonical");

-- These indexes allow one canonical geographic organization per active scope while
-- permitting legacy non-canonical duplicates during cleanup.
CREATE UNIQUE INDEX "organizations_one_canonical_central_key"
  ON "organizations" ((1))
  WHERE "level" = 'CENTRAL' AND "canonical" = true AND "isDeleted" = false;

CREATE UNIQUE INDEX "organizations_one_canonical_division_key"
  ON "organizations"("divisionId")
  WHERE "level" = 'DIVISION' AND "canonical" = true AND "isDeleted" = false;

CREATE UNIQUE INDEX "organizations_one_canonical_district_key"
  ON "organizations"("districtId")
  WHERE "level" = 'DISTRICT' AND "canonical" = true AND "isDeleted" = false;

CREATE UNIQUE INDEX "organizations_one_canonical_upazila_key"
  ON "organizations"("upazilaId")
  WHERE "level" = 'UPAZILA' AND "canonical" = true AND "isDeleted" = false;

ALTER TABLE "OrganizationMembers"
  ADD COLUMN "category" "GovernanceCategory" NOT NULL DEFAULT 'COMMITTEE',
  ADD COLUMN "appointedById" TEXT,
  ADD COLUMN "activatedAt" TIMESTAMP(3),
  ADD COLUMN "endedAt" TIMESTAMP(3);

UPDATE "OrganizationMembers"
SET "activatedAt" = "joinedAt"
WHERE "status" = 'ACTIVE' AND "activatedAt" IS NULL;

ALTER TABLE "OrganizationMembers"
  ADD CONSTRAINT "OrganizationMembers_appointedById_fkey"
  FOREIGN KEY ("appointedById") REFERENCES "donors"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "OrganizationMembers_category_idx" ON "OrganizationMembers"("category");
CREATE INDEX "OrganizationMembers_appointedById_idx" ON "OrganizationMembers"("appointedById");

CREATE TABLE "donor_organization_affiliations" (
  "id" TEXT NOT NULL,
  "donorId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "upazilaId" TEXT NOT NULL,
  "source" "AffiliationSource" NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "donor_organization_affiliations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "donor_organization_affiliations_donorId_key"
  ON "donor_organization_affiliations"("donorId");
CREATE INDEX "donor_organization_affiliations_organizationId_active_idx"
  ON "donor_organization_affiliations"("organizationId", "active");
CREATE INDEX "donor_organization_affiliations_upazilaId_active_idx"
  ON "donor_organization_affiliations"("upazilaId", "active");

ALTER TABLE "donor_organization_affiliations"
  ADD CONSTRAINT "donor_organization_affiliations_donorId_fkey"
  FOREIGN KEY ("donorId") REFERENCES "donors"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "donor_organization_affiliations"
  ADD CONSTRAINT "donor_organization_affiliations_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "donor_organization_affiliations"
  ADD CONSTRAINT "donor_organization_affiliations_upazilaId_fkey"
  FOREIGN KEY ("upazilaId") REFERENCES "upazilas"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add request state-machine metadata. Legacy rows receive stable readable references.
ALTER TABLE "BloodRequests"
  ADD COLUMN "referenceCode" TEXT,
  ADD COLUMN "handledByOrganizationId" TEXT,
  ADD COLUMN "acceptedById" TEXT,
  ADD COLUMN "acceptedAt" TIMESTAMP(3),
  ADD COLUMN "donorFoundAt" TIMESTAMP(3),
  ADD COLUMN "fulfilledAt" TIMESTAMP(3),
  ADD COLUMN "handoverCompletedAt" TIMESTAMP(3),
  ADD COLUMN "completedById" TEXT,
  ADD COLUMN "rejectedAt" TIMESTAMP(3),
  ADD COLUMN "rejectedById" TEXT,
  ADD COLUMN "cancellationReason" TEXT,
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

UPDATE "BloodRequests"
SET "referenceCode" = 'BR-' || UPPER(REPLACE("id", '-', ''));

ALTER TABLE "BloodRequests" ALTER COLUMN "referenceCode" SET NOT NULL;
CREATE UNIQUE INDEX "BloodRequests_referenceCode_key" ON "BloodRequests"("referenceCode");
CREATE INDEX "BloodRequests_handledByOrganizationId_idx" ON "BloodRequests"("handledByOrganizationId");

ALTER TABLE "BloodRequests"
  ADD CONSTRAINT "BloodRequests_handledByOrganizationId_fkey"
  FOREIGN KEY ("handledByOrganizationId") REFERENCES "organizations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "BloodRequests_acceptedById_fkey"
  FOREIGN KEY ("acceptedById") REFERENCES "donors"("id")
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "BloodRequests_completedById_fkey"
  FOREIGN KEY ("completedById") REFERENCES "donors"("id")
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "BloodRequests_rejectedById_fkey"
  FOREIGN KEY ("rejectedById") REFERENCES "donors"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BloodRequests"
  ADD CONSTRAINT "BloodRequests_requiredUnits_positive_check"
  CHECK ("requiredUnits" > 0) NOT VALID;

ALTER TABLE "requestAssignments"
  ADD COLUMN "bagUnits" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "notifiedAt" TIMESTAMP(3),
  ADD COLUMN "declinedAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "donationSubmittedAt" TIMESTAMP(3),
  ADD COLUMN "donatedAt" TIMESTAMP(3),
  ADD COLUMN "declineReason" TEXT;

UPDATE "requestAssignments"
SET "notifiedAt" = "assignedAt"
WHERE "notifiedAt" IS NULL;

ALTER TABLE "requestAssignments"
  ADD CONSTRAINT "requestAssignments_bagUnits_one_check"
  CHECK ("bagUnits" = 1);

CREATE INDEX "requestAssignments_requestId_status_idx"
  ON "requestAssignments"("requestId", "status");

-- The preflight blocks duplicate assignment links before this invariant is installed.
CREATE UNIQUE INDEX "bloodDonations_requestAssignmentId_key"
  ON "bloodDonations"("requestAssignmentId");

-- One verified donation may support at most one personal donation post.
ALTER TABLE "posts" ADD COLUMN "donationId" TEXT;
CREATE UNIQUE INDEX "posts_donationId_key" ON "posts"("donationId");
ALTER TABLE "posts"
  ADD CONSTRAINT "posts_donationId_fkey"
  FOREIGN KEY ("donationId") REFERENCES "bloodDonations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Durable business-message delivery with idempotency and retry scheduling.
CREATE TABLE "message_outbox" (
  "id" TEXT NOT NULL,
  "channel" "MessageChannel" NOT NULL,
  "templateKey" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "aggregateType" TEXT NOT NULL,
  "aggregateId" TEXT NOT NULL,
  "eventKey" TEXT NOT NULL,
  "status" "MessageOutboxStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "providerMessageId" TEXT,
  "lastError" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "message_outbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "message_outbox_eventKey_key" ON "message_outbox"("eventKey");
CREATE INDEX "message_outbox_status_nextAttemptAt_idx"
  ON "message_outbox"("status", "nextAttemptAt");
CREATE INDEX "message_outbox_aggregateType_aggregateId_idx"
  ON "message_outbox"("aggregateType", "aggregateId");
