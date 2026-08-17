-- Composite indexes for the highest-frequency donor history, public feed,
-- and notification inbox predicates. Equality columns precede sort columns.
CREATE INDEX "bloodDonations_donorId_isDeleted_createdAt_idx"
  ON "bloodDonations"("donorId", "isDeleted", "createdAt");

CREATE INDEX "bloodDonations_donorId_isDeleted_verificationStatus_donationDate_idx"
  ON "bloodDonations"("donorId", "isDeleted", "verificationStatus", "donationDate");

CREATE INDEX "posts_approvalStatus_visibility_isDeleted_createdAt_idx"
  ON "posts"("approvalStatus", "visibility", "isDeleted", "createdAt");

CREATE INDEX "notifications_donorId_isDeleted_isRead_createdAt_idx"
  ON "notifications"("donorId", "isDeleted", "isRead", "createdAt");
