-- AlterTable
-- Gallery.organizationId is now nullable: organizationId IS NULL represents
-- an admin-only "Homepage Gallery" item (not owned by any Organization),
-- mirroring the existing null-organizationId convention already used by
-- OrganizationMember for Central/National leadership. The existing foreign
-- key constraint on "galleries"."organizationId" -> "organizations"."id" is
-- left in place; Postgres foreign keys do not apply to NULL values, so no
-- constraint changes are needed beyond dropping NOT NULL.
ALTER TABLE "galleries" ALTER COLUMN "organizationId" DROP NOT NULL;
