-- Performance indexes added during the optimization pass.
-- These are purely additive (no column/table changes) and match the
-- composite index additions in prisma/schema/schema.prisma.
--
-- Note: on a large, already-live table, consider running the equivalent
-- `CREATE INDEX CONCURRENTLY` statements manually outside of a transaction
-- instead of via `prisma migrate deploy` (which wraps this file in a single
-- transaction, and Postgres does not allow CONCURRENTLY inside one). These
-- are written as plain CREATE INDEX to match every other migration in this
-- project and are safe to apply via the normal migration flow at this
-- project's current data volume.

-- Donor: composite index matching the donor-matching hot path used by
-- dispatchBloodRequestDonorAlerts (district + upazila + blood group +
-- account/availability status, all filtered together on every urgent
-- blood request).
CREATE INDEX "donors_districtId_upazilaId_bloodGroupId_accountStatus_availabilityStatus_idx"
  ON "donors"("districtId", "upazilaId", "bloodGroupId", "accountStatus", "availabilityStatus");

-- BloodRequest: supports ORDER BY createdAt DESC used by every request
-- listing and the analytics activity feed.
CREATE INDEX "BloodRequests_createdAt_idx" ON "BloodRequests"("createdAt");

-- Notification: supports "this donor's notifications, newest first",
-- the most common query shape in this model.
CREATE INDEX "notifications_donorId_createdAt_idx" ON "notifications"("donorId", "createdAt");

-- Post: supports an organization's posts newest-first, and the public
-- approved-posts feed newest-first.
CREATE INDEX "posts_organizationId_createdAt_idx" ON "posts"("organizationId", "createdAt");
CREATE INDEX "posts_approvalStatus_createdAt_idx" ON "posts"("approvalStatus", "createdAt");

-- BloodDonation: this model previously had no index on organizationId at
-- all, which would make the org-scoped analytics activity-feed query a
-- full sequential scan. Also adds createdAt support for the global feed.
CREATE INDEX "bloodDonations_organizationId_idx" ON "bloodDonations"("organizationId");
CREATE INDEX "bloodDonations_createdAt_idx" ON "bloodDonations"("createdAt");
