# Phase 6 Frontend Cutover

Phase 6 moves the active Next.js workflows onto the command-oriented request lifecycle introduced in Phase 5. The frontend now distinguishes commitment from verified fulfillment, uses server-derived donor capabilities, and exposes safe public request tracking.

## Deployment prerequisites

Deploy this frontend only after:

1. Phase 1 additive schema migration is deployed.
2. Phase 2 organization and affiliation backfill is verified.
3. Phase 3 profile readiness is enabled.
4. Phase 4 request lifecycle backfill is complete.
5. Phase 5 command endpoints, scoped reads, linked donation submission, post eligibility, and tracking endpoints are deployed.

The frontend still treats backend guards as authoritative. Disabled controls improve the experience but do not replace transition, capability, jurisdiction, or capacity enforcement.

## Public request and tracking

The public request form:

- Validates Bangladesh mobile numbers.
- Accepts one through ten required bags.
- Requires Division, District, and Upazila selection with cascading choices.
- Does not submit an organization identifier; the API resolves the canonical Upazila organization.
- Displays the immutable reference code returned after submission.
- Links the requester to `/blood-request/track`.

The tracking page requires a reference code and at least the final four requester phone digits. It displays only the safe tracking projection: status, blood group, required/committed/verified bag progress, location, hospital, and status history. It does not expose requester phone details or donor identities.

## Organization request dashboard

The active request dashboard now reads the scoped blood request API directly and uses dedicated command controls:

- `SUBMITTED`: start processing, reject, or cancel.
- `PROCESSING`: notify eligible donors or cancel.
- `DONOR_FOUND`: display full commitment and wait for donation verification.
- `FULFILLED`: confirm hand-over.
- Terminal states: no further lifecycle action.

The table shows required, committed, verified, remaining commitment, and remaining fulfillment bags separately. Generic arbitrary status selection is no longer used by the active dashboard.

## Donor assignment and donation workflow

Donor notifications now:

- Enable acceptance only for actionable assignment notifications.
- Use server-derived `canAcceptBloodRequests` and show profile, verification, or cooldown blocking context.
- Handle `REQUEST_CAPACITY_REACHED`, `ASSIGNMENT_NOT_ACTIONABLE`, and `REQUEST_CLOSED` conflicts as an already-arranged request.
- Refresh stale notifications and close stale assignment actions after a capacity conflict.
- Keep acceptance separate from donation submission.
- Allow an accepted assignment to submit one linked donation for organization verification.
- Use `canSubmitDonation` before exposing the submission action.

The donor donations page distinguishes pending evidence from verified donations and shows linked request context where available.

## Profile readiness and post eligibility

Private donor pages retain the non-dismissible profile completion gate when the server reports `INCOMPLETE`. The gate lists missing readiness fields and uses the existing profile editor to complete geographic data and trigger canonical affiliation synchronization.

Personal donation posts are capability-gated and require selecting an unused verified donation. The selected donation ID is submitted with the post, preserving one verified donation to one recap post eligibility.

## Implementation-plan completion matrix

| Plan requirement | Implementation status |
|---|---|
| Profile completion gate | Complete. Incomplete donors receive a non-dismissible modal backed by server readiness fields. |
| Capability-based UI | Complete for assignment acceptance, donation submission, and personal donation-post creation. |
| Public canonical request payload | Complete. Organization ID is absent from the request form contract and payload. |
| Public tracking | Complete. Reference plus phone suffix returns and renders a safe timeline and bag summary. |
| Command-oriented organization dashboard | Complete. The active table uses processing, rejection, cancellation, dispatch, and hand-over commands. |
| Separate commitment and fulfillment progress | Complete. Required, committed, and verified bags are displayed independently. |
| Stale donor action handling | Complete. Capacity and closed-request conflicts refresh and disable stale actions. |
| Linked donation submission | Complete. Accepted assignments create server-derived request-linked donation evidence. |
| Donation-specific post eligibility | Complete. The post composer fetches eligible verified donations and submits `donationId`. |
| Organization hierarchy UI split | Not included in this slice. Donor, committee, and advisor hierarchy views remain a later Phase 6/Phase 7 task. |
| Legacy client endpoint removal | Complete in the Phase 7 safe cleanup slice. Compatibility client mutations and the unreferenced arbitrary-status table were removed after active screens moved to commands. |

## Verification

Validated in this implementation slice:

```bash
cd apps/api
npm test -- --test-name-pattern="organization dashboard|donor assignment UX|public request UX|profile and donation-post"

cd apps/web
npm run typecheck
npm run lint -- "src/app/(private)/dashboard/donor/notifications/page.tsx" "src/components/modules/Donor/Posts/DonorPosts.tsx" "src/components/modules/Organization/PublicOrganizationProfile/RequestBloodForm.tsx" "src/components/modules/Organization/PublicOrganizationProfile/RequestBloodDialog.tsx"
```

The focused API contract run passed all selected Phase 6 cases. Web TypeScript and focused lint completed without errors or warnings.

Before production cutover, also run the full web build, the full API suite, disposable PostgreSQL concurrency tests, and browser end-to-end scenarios for public submission through completed hand-over. `TEST_DATABASE_URL` was not configured during this focused verification, so the disposable database test was skipped.

## Rollback boundary

The Phase 6 frontend depends on modern request statuses and Phase 5 command endpoints. Rolling back only the API while leaving this frontend deployed will break lifecycle actions and safe tracking. A frontend rollback can coexist with the additive schema, but legacy screens must not be allowed to manually force `DONOR_FOUND` or `FULFILLED`; Phase 5 backend guards remain required throughout rollback.
