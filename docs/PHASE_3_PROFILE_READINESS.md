# Phase 3 Donor Profile Readiness

Phase 3 makes donor operational readiness explicit, backfills persisted profile status, enriches the authenticated profile contract, validates geographic ancestry on profile updates, and restricts public donor data to a privacy-safe projection.

## Completion policy

A donor is `COMPLETE` only when all of these facts are true:

- Full name is present.
- Phone is present.
- Email is verified.
- Blood group is present.
- Division, District, and Upazila are present and form a valid active ancestry chain.
- An active donor affiliation can be resolved from the new relation or the temporary legacy Normal Donor fallback.

Phone verification is an independent trust signal and is not required for profile completion.

## Authenticated profile contract

`GET /user/me` retains the private donor profile and adds:

- `profileStatus`
- `missingProfileFields`
- `emailVerified`
- `phoneVerified`
- `affiliation`
- `cooldown`
- `capabilities`

Capabilities are server-derived. Request acceptance accounts for profile completion, email verification, account status, availability, and the authoritative next-eligible date. Dashboard access requires an active EXECUTIVE or MANAGEMENT governance membership. Donation-post capability remains disabled until verified unused donation eligibility is implemented in the later service cutover phase.

## Profile updates

`PATCH /user/update` validates that supplied Division and District IDs match the selected Upazila. It then performs these writes in one transaction:

1. Normalize location IDs to the selected Upazila ancestry.
2. Update donor profile fields.
3. Synchronize the new donor affiliation and legacy Normal Donor membership.
4. Recalculate and persist profile status and completion timestamp.

A conflicting geographic payload is rejected instead of being silently corrected.

## Public donor privacy

Public donor endpoints now require `profileStatus = COMPLETE` in addition to active account and verified email. Responses use an explicit allowlist and do not expose:

- Phone number
- Email address
- Password
- Account status
- Role
- Referral data
- Notification preferences
- Raw phone-verification timestamp
- Internal profile status

They expose `phoneVerified` as a boolean trust signal and retain public identity, blood group, geographic labels, availability, cooldown dates, photo, bio, and affiliated organization identity.

## Backfill dry run

Complete and verify Phase 2 first. From `apps/api` run:

```bash
npm run backfill:profiles > phase-3-profile-report.json
```

The command is read-only without `--apply`. Review:

- `INVALID_GEOGRAPHIC_ANCESTRY`
- `MISSING_AFFILIATION`
- Complete and incomplete totals

Rehearse against a sanitized production snapshot before deployment.

## Apply

After reviewing the dry-run output and taking a restorable backup:

```bash
npm run backfill:profiles:apply > phase-3-profile-applied.json
```

All status updates execute in one transaction. Existing `profileCompletedAt` values are preserved for donors who remain complete. Donors that no longer satisfy the policy become incomplete and have the completion timestamp cleared.

## Verification

```bash
npm run typecheck
npm test
npm run test:db
```

Verify against the database that:

- Every COMPLETE donor has verified email, valid geographic ancestry, and active affiliation.
- Public donor endpoints return only COMPLETE donors.
- Public payloads contain no phone or email values.
- Profile Upazila changes update affiliation atomically.
- Cooldown donors cannot accept blood requests even if their availability projection is stale.

## Rollback boundary

The authoritative rollback for an incorrect bulk apply is database restoration. Before later lifecycle cutover, the application can temporarily stop filtering public donors by profile status and stop consuming capability fields, but privacy-safe public projections should not be rolled back. Phase 2 legacy affiliation fallback remains available until the final cleanup migration.
