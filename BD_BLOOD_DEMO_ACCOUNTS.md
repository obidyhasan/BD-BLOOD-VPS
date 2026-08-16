# BD Blood Demo Accounts

These accounts are fictional development/test accounts created by `npm run seed:demo`. Do not use the shared password in production.

## Shared credentials

- Password for every account below: `Demo@BDblood2026!`
- Current development Super Admin email: `obidyhasan@gmail.com`
- Donor and organization-member emails end in `@demo.bdblood.local`.

The demo command intentionally synchronizes the one existing development Super Admin's password. It refuses to run when `NODE_ENV=production`.

## Core QA accounts

| Scenario | Email | Expected state |
| --- | --- | --- |
| Super Admin | `obidyhasan@gmail.com` | Full admin access; complete and verified profile |
| Ready A+ donor | `a-positive-ready@demo.bdblood.local` | Complete, verified, available; pending donation and eligible verified donation |
| Cooldown A− donor | `a-negative-cooldown@demo.bdblood.local` | Complete, verified, unavailable |
| Ready B+ donor | `b-positive-ready@demo.bdblood.local` | Complete, verified, available; rejected donation scenario |
| Incomplete B− donor | `b-negative-incomplete@demo.bdblood.local` | Incomplete and unverified profile |
| Ready AB+ donor | `ab-positive-ready@demo.bdblood.local` | Complete, verified, available |
| Unverified AB− donor | `ab-negative-unverified@demo.bdblood.local` | Complete profile but unverified account |
| Awarded O+ donor | `o-positive-ready@demo.bdblood.local` | Three verified historical donations and achievement awards |
| Ready O− donor | `o-negative-ready@demo.bdblood.local` | Linked verified donation; active cooldown |
| Suspended donor | `suspended@demo.bdblood.local` | Suspended and unavailable |
| Inactive donor | `inactive@demo.bdblood.local` | Inactive and unavailable |
| Email preference donor | `settings-email@demo.bdblood.local` | Email enabled, SMS disabled, in-app enabled |

## Organization-member accounts

All governance users are complete, verified, active donors. The following deterministic addresses are useful representative logins:

| Scope / role | Email |
| --- | --- |
| Central committee | `member-central-committee-1@demo.bdblood.local` |
| Central advisor | `member-central-advisor-1@demo.bdblood.local` |
| First representative division committee | `member-division-1-committee-1@demo.bdblood.local` |
| First representative division advisor | `member-division-1-advisor-1@demo.bdblood.local` |
| First representative district committee | `member-district-1-committee-1@demo.bdblood.local` |
| First representative district advisor | `member-district-1-advisor-1@demo.bdblood.local` |
| Primary Upazila committee | `member-upazila-1-committee-1@demo.bdblood.local` |
| Secondary Upazila committee | `member-upazila-2-committee-1@demo.bdblood.local` |

The complete deterministic pattern is `member-{scope}-{committee|advisor}-{seat}@demo.bdblood.local`. Division and district scopes are numbered 1–2; committee/advisor seats are 1–11. The central committee has 10 generated members plus the Super Admin, giving 11 seats total.

## Safety

- Every account is marked by a deterministic UUID and/or the `demo.bdblood.local` domain.
- Passwords are bcrypt hashes in the database; plaintext appears here only as an intentional demo credential.
- The seed writes directly through Prisma and does not send SMS, email, or provider messages.
- Re-running the seed updates the same records and does not delete unrelated records.
