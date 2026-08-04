-- Phase 2 performance pass: additive indexes matching the getAllGalleries
-- and getAllInstitutions query patterns.

-- Gallery had a foreign key to Organization but no index backing it, so
-- every org-scoped gallery listing (getAllGalleries with organizationId
-- filter) was a sequential scan.
CREATE INDEX "galleries_organizationId_idx" ON "galleries"("organizationId");

-- getAllInstitutions filters on divisionId and upazilaId (in addition to
-- districtId, which already had an index), but only districtId was
-- actually indexed.
CREATE INDEX "medicalInstitutions_divisionId_idx" ON "medicalInstitutions"("divisionId");
CREATE INDEX "medicalInstitutions_upazilaId_idx" ON "medicalInstitutions"("upazilaId");
