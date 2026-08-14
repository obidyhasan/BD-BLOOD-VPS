-- Geographic identity and ancestry constraints
CREATE UNIQUE INDEX "divisions_name_key" ON "divisions"("name");
CREATE UNIQUE INDEX "districts_divisionId_name_key" ON "districts"("divisionId", "name");
CREATE UNIQUE INDEX "upazilas_districtId_name_key" ON "upazilas"("districtId", "name");
CREATE UNIQUE INDEX "districts_id_divisionId_key" ON "districts"("id", "divisionId");
CREATE UNIQUE INDEX "upazilas_id_districtId_key" ON "upazilas"("id", "districtId");

ALTER TABLE "organizations"
  ADD CONSTRAINT "organizations_divisionId_fkey"
  FOREIGN KEY ("divisionId") REFERENCES "divisions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "organizations_districtId_fkey"
  FOREIGN KEY ("districtId") REFERENCES "districts"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "organizations_upazilaId_fkey"
  FOREIGN KEY ("upazilaId") REFERENCES "upazilas"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "organizations_districtId_divisionId_fkey"
  FOREIGN KEY ("districtId", "divisionId")
  REFERENCES "districts"("id", "divisionId")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "organizations_upazilaId_districtId_fkey"
  FOREIGN KEY ("upazilaId", "districtId")
  REFERENCES "upazilas"("id", "districtId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "organizations_divisionId_idx" ON "organizations"("divisionId");
CREATE INDEX "organizations_upazilaId_idx" ON "organizations"("upazilaId");

-- Exactly one active organization is allowed for each Upazila. Higher-level
-- canonical organizations may share representative geo IDs without collision.
CREATE UNIQUE INDEX "organizations_active_upazila_key"
  ON "organizations"("upazilaId")
  WHERE "level" = 'UPAZILA' AND "isDeleted" = false;

CREATE UNIQUE INDEX "organizations_canonical_central_key"
  ON "organizations" ((1))
  WHERE "level" = 'CENTRAL' AND "canonical" = true AND "isDeleted" = false;
CREATE UNIQUE INDEX "organizations_canonical_division_key"
  ON "organizations"("divisionId")
  WHERE "level" = 'DIVISION' AND "canonical" = true AND "isDeleted" = false;
CREATE UNIQUE INDEX "organizations_canonical_district_key"
  ON "organizations"("districtId")
  WHERE "level" = 'DISTRICT' AND "canonical" = true AND "isDeleted" = false;
CREATE UNIQUE INDEX "organizations_canonical_upazila_key"
  ON "organizations"("upazilaId")
  WHERE "level" = 'UPAZILA' AND "canonical" = true AND "isDeleted" = false;

-- Core blood-request invariants are enforced even for non-HTTP writers.
ALTER TABLE "BloodRequests"
  ADD CONSTRAINT "BloodRequests_requiredUnits_check"
  CHECK ("requiredUnits" BETWEEN 1 AND 10);

ALTER TABLE "requestAssignments"
  ADD CONSTRAINT "requestAssignments_bagUnits_check"
  CHECK ("bagUnits" = 1);
