-- AlterTable: donor cooldown tracking.
-- nextEligibleDonationDate is set (donationDate + 3 months) whenever a
-- donation is VERIFIED, and is used to automatically flip a donor's
-- availabilityStatus back to AVAILABLE once it has passed (see
-- jobs/donorAvailabilitySweeper.ts).
ALTER TABLE "donors" ADD COLUMN "nextEligibleDonationDate" TIMESTAMP(3);

-- AlterTable: optional link from a donation to the RequestAssignment it
-- fulfills, so "accepted" (RequestAssignmentStatus.ACCEPTED) can be
-- distinguished from "actually donated" (a VERIFIED BloodDonation linked
-- back to the assignment).
ALTER TABLE "bloodDonations" ADD COLUMN "requestAssignmentId" TEXT;

-- CreateIndex
CREATE INDEX "donors_nextEligibleDonationDate_idx" ON "donors"("nextEligibleDonationDate");
CREATE INDEX "bloodDonations_requestAssignmentId_idx" ON "bloodDonations"("requestAssignmentId");

-- AddForeignKey
ALTER TABLE "bloodDonations" ADD CONSTRAINT "bloodDonations_requestAssignmentId_fkey" FOREIGN KEY ("requestAssignmentId") REFERENCES "requestAssignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
