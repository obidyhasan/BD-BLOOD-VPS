# BD Blood Demo/Test Dataset

## Commands

From the repository root:

```bash
npm run seed:demo
npm run verify:demo
```

`seed:demo` first ensures required reference geography, blood groups, achievements, and canonical organizations exist, then upserts the isolated demo dataset. It refuses `NODE_ENV=production` and requires an internal confirmation flag supplied only by the dedicated npm script. It never truncates tables or performs broad deletes.

The shared login credentials and representative organization accounts are in [BD_BLOOD_DEMO_ACCOUNTS.md](./BD_BLOOD_DEMO_ACCOUNTS.md).

## Verified dataset size

The command was run twice against the configured development database and returned the same counts on both runs:

| Area | Count / state coverage |
| --- | --- |
| Demo donor accounts | 142 total: 131 governance users + 11 donor scenarios |
| Governance | 131 deterministic member seats plus the existing Super Admin seat |
| Blood groups | All 8 represented by scenario donors |
| Blood requests | 7: Submitted, Processing, Donor Found, Fulfilled, Completed, Cancelled, Rejected |
| Assignments | 7 across Accepted, Donated, Cancelled, Declined and multi-donor scenarios |
| Donations | 9 across Pending, Verified and Rejected |
| Posts | 12 total; 10 approved, 1 pending, 1 rejected |
| Events | 4 across approved, pending and rejected |
| Blogs | 4 across approved, pending and rejected |
| Galleries | 4 across approved, pending and rejected |
| Medical institutions | 3 institutions, 6 doctors, 4 library articles, 3 ads |
| Notifications | 8 across multiple types, priorities, read/unread and related links |
| FAQs | 4 active demo FAQs |
| Achievements | 3 awards attached to the historical O+ donor |

The development database also retains the production-safe reference dataset: 8 divisions, 64 districts, 495 Upazilas, 568 canonical organizations, and 4 achievement definitions.

## Coverage map

| Product surface | Seeded scenarios / where to look |
| --- | --- |
| Authentication | Super Admin, standard donors, governance members, inactive and suspended accounts; exact logins in the accounts guide |
| Profile completion | Complete profiles with photos/bios/location/affiliation, one incomplete donor, one complete-but-unverified donor |
| Referrals | Scenario donors include deterministic `referenceId` relationships |
| Settings | `settings-email@demo.bdblood.local` has email on/SMS off; other accounts exercise default preferences |
| Root governance | 11-person central committee including Super Admin plus 11 central advisors |
| Regional governance | Two representative division committees and advisor groups, each 11+11; two district groups, each 11+11 |
| Local organizations | Two fully populated 11-person Upazila committees; primary and secondary organization ownership examples |
| Inventory | All eight blood groups stocked at the primary organization with differing unit counts |
| Requests | Every current non-legacy lifecycle state, urgent/general types, 1- and 2-unit needs, organization handling, status history |
| Capacity edge cases | Submitted request has 0 accepted; Processing has 1 accepted; Donor Found has 2 accepted for 2 required units |
| Dispatch/alerts | Organization notifications and direct donor alerts exist with `smsSent=false`; no external dispatch occurs |
| Assignments | Accepted, declined, cancelled and donated examples; one verified donation links to its assignment |
| Donation moderation | Pending, verified and rejected donations; multi-donation history; eligibility/cooldown dates |
| Donation posting | `demo-post-1` is linked to a verified eligible donation; includes a like and comment |
| Organization success stories | Nine approved posts owned by the primary organization and one by the secondary; several are featured as “Our Work” |
| Post moderation | Approved, pending and rejected posts, plus public/private visibility |
| Events | Upcoming and past records, organization ownership, participants, approval queue states |
| Blogs | Public approved articles and admin pending/rejected queues with review metadata |
| Gallery/home | Featured homepage album, organization album, pending/rejected moderation states |
| Medical directory | Three locations with Bangladesh-oriented addresses, open-status variants and six doctors |
| Medical library | Three published articles plus one draft |
| Medical ads | Two active/current ads and one inactive/expired ad; no ad provider calls |
| Homepage/support | Approved work posts, gallery, FAQs, events, inventory and achievements support populated public sections |
| Notifications | Donor and admin notifications across request, blood, org, post and system types; mixed priority/read states |
| Admin dashboard | Pending donation/post/blog/event/gallery/report/contact queues plus request and donor operational data |
| Donor dashboard/history | Assignments, alerts, notifications, verified history, pending/rejected donations and achievement awards |

## Expected visual states

- Public pages show approved public posts, approved blogs/events/galleries, published medical articles, institutions/doctors, active ads, and active FAQs.
- Admin management pages show both public records and pending/rejected moderation examples.
- Organization pages show meaningful primary/secondary branch content and complete committee rosters.
- Donor pages show all blood groups, eligibility differences, profile-readiness differences, referrals, history, awards, and notification preferences.
- Request management shows real schema enum values and linked organization/assignment/history records rather than display-only placeholders.

## Idempotence and ownership

Demo records use SHA-256-derived stable UUIDs and unique markers such as `demo.bdblood.local`, `DEMO-####`, `demo-post-*`, `demo-event-*`, and `demo-medical-*`. Upserts target these exact identifiers. The script does not truncate, reset, or delete unrelated data. Reference seeds are also idempotent.

Some dates intentionally move relative to the day the seed is run so “upcoming”, “active ad”, donation cooldown, and expiry views remain testable. Identifiers, relationships, counts, and scenario meanings remain stable.

## Verification behavior

`npm run verify:demo` is read-only. It fails if any of these contracts drift: eight blood groups, governance roster sizes, lifecycle states, 0/1/2 donor capacity, linked histories/notifications, donation moderation mix, ten approved posts, content moderation coverage, medical content counts, FAQs, notifications, or achievements.

No `MessageOutbox` entries are created by the demo seed. This prevents workers from sending demo SMS/email while preserving in-app notification and donor-alert UI coverage.
