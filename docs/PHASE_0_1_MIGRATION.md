# Phase 0/1 Migration Runbook

This runbook covers the safety baseline and additive schema foundation introduced by the `20260804140000_system_phase1_foundations` migration. It does not switch application behavior to the new request state machine.

## Included changes

- Node's built-in TypeScript test harness and a PostgreSQL test-client helper that only accepts `TEST_DATABASE_URL`.
- A read-only migration anomaly audit with machine-readable JSON output and blocker exit codes.
- Additive organization hierarchy metadata and canonical-scope indexes.
- Dedicated donor organization affiliations.
- Donor profile readiness fields.
- Request and assignment state-machine fields and new enum values, while retaining legacy values.
- One-bag assignment checks and one donation per assignment.
- Donation-linked personal posts.
- Durable message outbox storage.

## Required pre-deployment sequence

1. Back up the target database and verify restoration on a separate PostgreSQL instance.
2. Run the anomaly audit against a sanitized production snapshot:

```cmd
cd apps\api && npm run audit:migration
```

The command exits with code `2` when blocker anomalies exist. Resolve these before deployment:

- invalid organization geography;
- non-positive request bag counts;
- multiple active donations linked to one assignment.

Warnings require a documented backfill decision but do not block the additive migration.

3. Rehearse all migrations against the sanitized snapshot using a disposable database.
4. Configure a separate disposable `TEST_DATABASE_URL` and run:

```cmd
cd apps\api && npm run test:db
```

5. Deploy the additive migration:

```cmd
cd apps\api && npm run migrate:deploy
```

6. Generate Prisma Client and validate the application:

```cmd
cd apps\api && npx prisma generate --config prisma.config.ts && npx prisma validate --config prisma.config.ts && npm test
```

## Safety behavior

- Existing organizations default to `UPAZILA` and `canonical = false`; no legacy row becomes canonical automatically.
- Existing requests keep their current statuses and receive immutable `BR-...` reference codes.
- Existing assignments keep legacy statuses and receive `bagUnits = 1` plus their original assignment time as notification time.
- Existing donors remain `INCOMPLETE` until the later readiness/affiliation backfill verifies every required field.
- The positive request-units check is installed as `NOT VALID`, allowing legacy anomalies to be fixed before explicit validation.
- Legacy organization location columns and membership uniqueness remain unchanged during this phase so the running application remains compatible.

## Rollback boundary

This migration is intentionally additive, but enum values cannot be removed safely in place. Rollback should restore the pre-migration backup rather than attempting a down migration after application writes use new enum values or new tables. Do not drop new columns while any deployed application version reads or writes them.

## Follow-up phase

The next migration must backfill canonical organization hierarchy and donor affiliations, reconcile legacy request/assignment states, validate pending constraints, and only then cut application reads and writes to the new model.
