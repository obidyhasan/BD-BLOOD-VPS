-- Gallery publication, featuring, and deterministic ordering controls.
ALTER TABLE "galleries"
  ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "galleries_organizationId_isPublished_sortOrder_idx"
  ON "galleries"("organizationId", "isPublished", "sortOrder");
CREATE INDEX "galleries_isFeatured_isPublished_idx"
  ON "galleries"("isFeatured", "isPublished");

-- An active governance appointment receives a deterministic seat key:
-- <organization-or-CENTRAL>:<category>:<positionId>. Inactive, rejected,
-- deleted, and ordinary SUPPORT donor-affiliation rows keep this NULL.
ALTER TABLE "OrganizationMembers" ADD COLUMN "seatKey" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "OrganizationMembers" AS membership
    JOIN "organizationPositions" AS position
      ON position."id" = membership."positionId"
    WHERE membership."status" = 'ACTIVE'
      AND membership."isDeleted" = false
      AND position."level" IN ('EXECUTIVE', 'MANAGEMENT')
    GROUP BY membership."organizationId", membership."category", membership."positionId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Active governance seat duplicates must be reconciled before applying content_governance_controls';
  END IF;
END $$;

UPDATE "OrganizationMembers" AS membership
SET "seatKey" = COALESCE(membership."organizationId", 'CENTRAL') || ':' || membership."category"::text || ':' || membership."positionId"
FROM "organizationPositions" AS position
WHERE membership."positionId" = position."id"
  AND membership."status" = 'ACTIVE'
  AND membership."isDeleted" = false
  AND position."level" IN ('EXECUTIVE', 'MANAGEMENT');

CREATE UNIQUE INDEX "OrganizationMembers_seatKey_key"
  ON "OrganizationMembers"("seatKey");
