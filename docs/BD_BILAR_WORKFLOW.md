# BD Blood Upazila Location → Affiliation → Membership Workflow ("BD_BILAR")

This document is the canonical contract for how a donor's **Upazila location
update** flows through BD Blood's domain model. It is referenced by automated
contract tests (`apps/api/test/organizationMappingPostFix.test.ts`) and is the
single source of truth for the behavior those tests enforce.

> ## Foundational distinction (enforced everywhere)
>
> Governance membership represents committee responsibility and is not ordinary donor affiliation.
>
> - An **affiliation** (`donor_affiliation`) is the automatic, geo-derived
>   relationship that every donor has to the canonical Upazila organization of
>   the place they live. It is derived from the donor's profile location and is
>   never a seat on any committee.
> - An **organization membership** (`organization_member`) is a governance seat
>   (committee / leadership) **or** an ordinary auto-membership that is pinned
>   to the *normal donor* position. Only the normal-donor membership may ever be
>   rewritten automatically by a location change.
> - A donor who holds a **committee/leadership seat** keeps that seat when they
>   move. Their location change updates their affiliation and their
>   normal-donor auto-membership only; it must never silently revoke or transfer
>   a governance seat they hold elsewhere.

---

## 1. Location update request

A donor updates their profile location via `PATCH /api/v1/user/my-profile`
(handled by `apps/api/src/app/modules/user/user.service.ts`,
`updateMyProfile`).

The payload may carry `divisionId`, `districtId` and `upazilaId`. The backend
never trusts the browser to pick a consistent hierarchy — it **re-derives**
the ancestry from the selected Upazila and rejects any payload that contradicts
it.

### 1.1 Validation rules (400 responses)

| Condition | Result |
| --- | --- |
| `upazilaId` is omitted but `districtId`/`divisionId` are sent | accepted only if consistent with the donor's current Upazila |
| Selected Upazila is soft-deleted, or its District/Division is soft-deleted | `404 Valid Upazila not found!` |
| `districtId` present and does not equal `upazila.districtId` | `400 District does not belong to the selected Upazila.` |
| `divisionId` present and does not equal `upazila.district.divisionId` | `400 Division does not belong to the selected District.` |

### 1.2 Canonicalization

When the request passes validation the server **overwrites** the client-supplied
ancestry with the authoritative values loaded from the Upazila row:

```ts
nextData.upazilaId   = upazila.id;
nextData.districtId  = upazila.districtId;
nextData.divisionId  = upazila.district.divisionId;
```

This guarantees a donor can never persist an orphaned/self-inconsistent
Division → District → Upazila triple, even if a compromised or stale client
sends one.

---

## 2. Canonical Upazila organization resolution

`resolveUpazilaOrganization(db, upazilaId)` finds the **canonical**,
non-deleted `Organization` whose `level = UPAZILA` and whose
`upazilaId` matches the donor's Upazila.

- Canonical organizations are created idempotently by the production seed
  (`src/app/seed/organizationSeed.ts`) using a **deterministic UUID**
  derived from `UPAZILA:<upazilaId>`. The seed re-verifies uniqueness and the
  Upazila↔District mapping before writing; if the existing row ever points at a
  different District the seed fails loudly instead of creating a duplicate.
- If no organization is configured for the Upazila the update fails with
  `404 No organization is configured for <upazila name>.` — profile updates do
  **not** silently create organizations.

---

## 3. Affiliation write

`upsertDonorAffiliation(tx, { donorId, organizationId, upazilaId, source:
AffiliationSource.PROFILE })` records that this donor is affiliated with the
canonical Upazila organization because of their profile location.

The affiliation row is a pure projection of the profile location. It is used by:

- public directory / privacy-safe reads,
- profile-readiness gating,
- request routing context (never as a governance claim).

---

## 4. Auto membership vs governance seat

`syncDonorOrganizationMembership(tx, donorId, upazilaId)` then reconciles the
donor's single `organizationMember` row **only if that row is an auto
membership**:

```ts
const isAutoMembership =
  existingMembership?.position?.positionName === NORMAL_DONOR_POSITION_NAME &&
  existingMembership.position.positionStatus === PositionStatus.GENERAL;

if (existingMembership && !isAutoMembership) {
  return existingMembership;   // governance seat — untouched
}
```

Behavior matrix:

| Existing member row | Action |
| --- | --- |
| No row | create ACTIVE membership at the new canonical Upazila org with the *normal donor* (SUPPORT/GENERAL) position |
| Auto row (`NORMAL_DONOR`, GENERAL) at an old Upazila | move it to the new canonical Upazila org (update, ACTIVE, undelete) |
| Governance/committee/leadership row | **return unchanged** — never rewritten, moved, or deleted by a location change |

This is what keeps "committee responsibility" and "ordinary donor
affiliation" separate: moving house changes where a donor is affiliated and
where their *normal* membership lives, but a governing seat (division/district
committee, national leadership, etc.) is only ever changed through the explicit
governance appointment flow.

---

## 5. Readiness recalculation

After the donor row, affiliation and membership are written, the service
rebuilds `profileReadiness` facts in the same transaction:

- `affiliation` is present,
- the full `division → district → upazila` ancestry exists and is consistent,

and stores `profileStatus` / `profileCompletedAt` accordingly (see
`src/app/shared/profileReadiness.ts`). Everything above happens inside one
Prisma transaction, so a failed derivation never leaves a half-written donor.

---

## 6. Rules of thumb for contributors

1. Never write `organization_member` rows with committee positions from a
   profile/location code path.
2. Never let a location update delete or move a governance seat.
3. Always re-derive `divisionId`/`districtId` from the persisted Upazila; never
   persist browser-supplied ancestry.
4. Always resolve the canonical Upazila organization through
   `resolveUpazilaOrganization`; never fabricate organizations at update time.
5. Keep affiliation and membership semantics separate in every query, DTO and
   UI label.
