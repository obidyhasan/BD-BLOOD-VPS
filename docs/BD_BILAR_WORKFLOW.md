# BD Blood Implemented Workflows

This document describes verified repository behavior as of the finalization audit. It is updated alongside implementation changes.

## Geography and organization hierarchy

```mermaid
flowchart LR
  BD[Bangladesh / Central] --> D[Division]
  D --> Z[District]
  Z --> U[Upazila]
  U --> O[Canonical Upazila Organization]
```

Canonical organizations form a parallel navigable tree (`CENTRAL → DIVISION → DISTRICT → UPAZILA`). Donor affiliation points to the canonical Upazila organization; governance membership represents committee responsibility and is not ordinary donor affiliation.

## Public organization navigation

```mermaid
flowchart LR
  R[Root: 11 members] --> D[Select Division]
  D --> DM[Division members / advisors]
  DM --> Z[Select District]
  Z --> ZM[District members / advisors]
  ZM --> U[Select Upazila]
  U --> P[Canonical organization profile]
  P --> X[Profile, committee, donors, inventory, posts, gallery, requests]
```

Root has committee members only. Division and District expose independent Committee and Advisor categories. Upazila exposes Committee only and redirects to the full organization profile.

## Membership

```mermaid
flowchart LR
  U[Registered verified donor] --> A[Active canonical Upazila affiliation]
  A --> P[Organization donor pool]
  U --> G[Governance appointment]
  G --> C{Organization level}
  C -->|Central / Division / District| M[Committee, or Advisor]
  C -->|Upazila| UM[Committee only]
```

Governance appointments reference existing active, verified donors. Category caps are 11 and are serialized transactionally. Dashboard access requires an active Executive or Management position in the requested organization, with Admin as the platform-wide superset.

## Blood request lifecycle

```mermaid
stateDiagram-v2
  [*] --> SUBMITTED: public validated idempotent request
  SUBMITTED --> PROCESSING: authorized organization starts work
  PROCESSING --> DONOR_FOUND: required bags committed
  DONOR_FOUND --> FULFILLED: required linked donations verified
  FULFILLED --> COMPLETED: authorized hand-over
  SUBMITTED --> REJECTED
  SUBMITTED --> CANCELLED
  PROCESSING --> CANCELLED
  DONOR_FOUND --> PROCESSING: donor withdrawal/replacement
```

Creation validates geographic ancestry and resolves exactly one canonical Upazila organization. Processing creates donor assignments for eligible donors in the authoritative affiliation. Acceptance revalidates donor status, blood group, affiliation, cooldown and capacity under a request row lock. Verification atomically updates the assignment, request aggregate, donor cooldown, achievements and post eligibility. SMS is written to a durable outbox and delivered by the worker.

## Authentication and authorization

```mermaid
flowchart LR
  L[Login / OAuth] --> I[Verified identity]
  I --> C[HttpOnly access + refresh cookies]
  C --> A[API verifies JWT]
  A --> S[Live account, role and status resolution]
  S --> P[Role + ownership/organization permission]
  P --> R[Authorized resource]
```

Frontend route guards improve navigation only. Every sensitive API route performs backend authentication and services enforce ownership or organization jurisdiction.

## Dashboard data access

```mermaid
flowchart TD
  U[Authenticated user] --> R{Live role}
  R -->|Admin| ALL[Platform-wide authorized data]
  R -->|Donor| OWN[Own profile, donations, assignments, notifications]
  R -->|Active org Executive/Management| SCOPE[Authorized organization scope]
  SCOPE --> ORG[Donors, requests, donations, inventory, appointments, posts, galleries, analytics]
```

Client-supplied organization IDs are identifiers, not authority. The API resolves current membership and checks the target row's organization before reading or mutating scoped data.

