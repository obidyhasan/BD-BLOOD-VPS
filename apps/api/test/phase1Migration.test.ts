import assert from "node:assert/strict";
import test from "node:test";
import { loadAllMigrationSql as loadMigration } from "./helpers/migrationSql";

test("phase 1 migration preserves legacy lifecycle values during cutover", async () => {
  const sql = await loadMigration();

  assert.doesNotMatch(sql, /DROP\s+TYPE\s+"BloodRequestStatus"/i);
  assert.doesNotMatch(sql, /DROP\s+TYPE\s+"RequestAssignmentStatus"/i);
  assert.match(sql, /BloodRequestStatus[\s\S]*?'DONOR_FOUND'/);
  assert.match(sql, /RequestAssignmentStatus[\s\S]*?'DONATED'/);
});

test("phase 1 migration installs bag and donation cardinality invariants", async () => {
  const sql = await loadMigration();

  assert.match(sql, /CHECK \("requiredUnits" (?:> 0|BETWEEN 1 AND 10)\)/);
  assert.match(sql, /CHECK \("bagUnits" = 1\)/);
  assert.match(sql, /UNIQUE INDEX "bloodDonations_requestAssignmentId_key"/);
});

test("phase 1 migration keeps legacy organizations non-canonical", async () => {
  const sql = await loadMigration();

  assert.match(sql, /"canonical" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(sql, /organizations_(?:one_|)canonical_upazila_key/);
});

test("phase 1 migration provides idempotent outbox events", async () => {
  const sql = await loadMigration();

  assert.match(sql, /CREATE TABLE "message_outbox"/);
  assert.match(sql, /UNIQUE INDEX "message_outbox_eventKey_key"/);
  assert.match(sql, /"status", "nextAttemptAt"/);
});
