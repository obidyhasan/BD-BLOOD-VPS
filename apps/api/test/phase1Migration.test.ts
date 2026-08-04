import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import path from "node:path";

const migrationPath = path.resolve(
  process.cwd(),
  "prisma/migrations/20260804140000_system_phase1_foundations/migration.sql",
);

const loadMigration = (): Promise<string> => readFile(migrationPath, "utf8");

test("phase 1 migration preserves legacy lifecycle values during cutover", async () => {
  const sql = await loadMigration();

  assert.doesNotMatch(sql, /DROP\s+TYPE\s+"BloodRequestStatus"/i);
  assert.doesNotMatch(sql, /DROP\s+TYPE\s+"RequestAssignmentStatus"/i);
  assert.match(sql, /ADD VALUE IF NOT EXISTS 'DONOR_FOUND'/);
  assert.match(sql, /ADD VALUE IF NOT EXISTS 'DONATED'/);
});

test("phase 1 migration installs bag and donation cardinality invariants", async () => {
  const sql = await loadMigration();

  assert.match(sql, /CHECK \("requiredUnits" > 0\) NOT VALID/);
  assert.match(sql, /CHECK \("bagUnits" = 1\)/);
  assert.match(sql, /UNIQUE INDEX "bloodDonations_requestAssignmentId_key"/);
});

test("phase 1 migration keeps legacy organizations non-canonical", async () => {
  const sql = await loadMigration();

  assert.match(
    sql,
    /ADD COLUMN "canonical" BOOLEAN NOT NULL DEFAULT false/,
  );
  assert.match(sql, /organizations_one_canonical_upazila_key/);
});

test("phase 1 migration provides idempotent outbox events", async () => {
  const sql = await loadMigration();

  assert.match(sql, /CREATE TABLE "message_outbox"/);
  assert.match(sql, /UNIQUE INDEX "message_outbox_eventKey_key"/);
  assert.match(sql, /"status", "nextAttemptAt"/);
});
