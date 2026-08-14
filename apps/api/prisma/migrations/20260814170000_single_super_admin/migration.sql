-- The platform has one Super Admin role. Presence is established by the
-- environment-driven seed; this partial index prevents a second active Admin.
CREATE UNIQUE INDEX "donors_single_active_admin_key"
  ON "donors" ((1))
  WHERE "role" = 'ADMIN' AND "isDeleted" = false;
