-- Canonical organization readers now use Organization.level. Clear the legacy
-- display/classification field only on canonical hierarchy rows; non-canonical
-- organization types remain untouched for backward-compatible custom labels.
UPDATE "organizations"
SET "type" = NULL,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "canonical" = true
  AND "isDeleted" = false
  AND "type" IS NOT NULL;
