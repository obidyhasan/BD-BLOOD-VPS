-- Refuse destructive appointment removal when another environment still has
-- records requiring an explicit archive/migration decision.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "donationAppointments" LIMIT 1) THEN
    RAISE EXCEPTION 'Cannot remove Booking Donation: donationAppointments contains records. Archive them explicitly first.';
  END IF;
END $$;

DROP TABLE "donationAppointments";
DROP TYPE "AppointmentStatus";

ALTER TABLE "blogs"
  ADD COLUMN "organizationId" TEXT,
  ADD COLUMN "reviewedById" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);

ALTER TABLE "events"
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "reviewedById" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);

-- Existing events were Admin-only and already public, so preserve their
-- visibility during the moderation cutover.
UPDATE "events" SET "approvalStatus" = 'APPROVED';

ALTER TABLE "galleries"
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "reviewedById" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);

-- Preserve previously published content; all new Organization writes are
-- forced to PENDING by the service regardless of client input.
UPDATE "galleries"
SET "approvalStatus" = CASE WHEN "isPublished" THEN 'APPROVED'::"ApprovalStatus" ELSE 'PENDING'::"ApprovalStatus" END;

ALTER TABLE "blogs"
  ADD CONSTRAINT "blogs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "blogs_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "events"
  ADD CONSTRAINT "events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "events_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "galleries"
  ADD CONSTRAINT "galleries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "galleries_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "medicalInstitutions"
  ADD CONSTRAINT "medicalInstitutions_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "medicalInstitutions_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "medicalInstitutions_upazilaId_fkey" FOREIGN KEY ("upazilaId") REFERENCES "upazilas"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "medicalInstitutions_upazilaId_districtId_fkey" FOREIGN KEY ("upazilaId", "districtId") REFERENCES "upazilas"("id", "districtId") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "medicalInstitutions_districtId_divisionId_fkey" FOREIGN KEY ("districtId", "divisionId") REFERENCES "districts"("id", "divisionId") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "blogs_organizationId_idx" ON "blogs"("organizationId");
CREATE INDEX "blogs_status_idx" ON "blogs"("status");
CREATE INDEX "events_approvalStatus_idx" ON "events"("approvalStatus");
CREATE INDEX "events_createdById_idx" ON "events"("createdById");
CREATE INDEX "galleries_approvalStatus_idx" ON "galleries"("approvalStatus");
CREATE INDEX "galleries_createdById_idx" ON "galleries"("createdById");
