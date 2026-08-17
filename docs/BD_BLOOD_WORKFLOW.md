# BD Blood Workflow

This document records the verified target architecture after comparing the new specification with the existing implementation.

## Public

```mermaid
flowchart LR
  Home --> Organization
  Home --> Medical
  Home --> Blog
  Home --> Event
  Home --> Gallery
```

Public APIs expose only active/verified organizations and approved/published content. Internal hierarchy explanations are not public UI.

## Need Blood

```mermaid
flowchart LR
  Division --> District --> Upazila --> CanonicalUpazilaOrganization[Upazila Organization]
  CanonicalUpazilaOrganization --> RequestBlood[Request Blood]
```

Changing a parent clears dependent selections. Upazila selection resolves one canonical `UPAZILA` organization before navigation.

## Blood Request

```mermaid
sequenceDiagram
  actor Public
  participant API
  participant Organization
  participant Donor
  participant DB
  participant Worker
  Public->>API: Submit request with canonical organization/location
  API->>DB: Transactionally create request + organization outbox event
  Organization->>API: Start processing and assign eligible donors
  API->>DB: Validate organization, affiliation, blood group and availability
  Donor->>API: Accept assignment
  API->>DB: Lock request and enforce remaining capacity
  Donor->>API: Submit linked donation evidence
  Organization->>API: Verify donation
  API->>DB: Derive fulfilled units and enqueue unique requester SMS
  Worker->>Public: Send completion SMS once with retries
```

## Donation

```mermaid
flowchart LR
  Request --> AssignmentAcceptance[Accepted Assignment]
  AssignmentAcceptance --> DonationEvidence[Donation Evidence]
  DonationEvidence --> VerifiedDonation[Verified Donation]
  VerifiedDonation --> History
  VerifiedDonation --> PostEntitlement[One Post Entitlement]
  PostEntitlement --> PendingPost[Pending Donor Post]
  PendingPost --> OrganizationApproval[Organization Approval]
  OrganizationApproval --> PublicPost[Approved Public Post]
  VerifiedDonation --> AchievementEvaluation[Achievement Evaluation]
```

Each assignment represents one bag and can link to at most one donation. Each verified donation can link to at most one post.

## Organization Hierarchy

```mermaid
flowchart TD
  Root[Central / National]
  Root --> Division
  Division --> District
  District --> UpazilaOrganization[Upazila Organization]
  UpazilaOrganization --> AffiliatedDonors[Affiliated Donors]
  Root --> RootCommittee[11 Committee Members]
  Root --> RootAdvisors[11 Advisors]
  Division --> DivisionCommittee[11 Committee Members]
  Division --> DivisionAdvisors[11 Advisors]
  District --> DistrictCommittee[11 Committee Members]
  District --> DistrictAdvisors[11 Advisors]
  UpazilaOrganization --> UpazilaCommittee[11 Committee Members]
```

Advisors are governance records but do not receive Organization dashboard access unless the confirmed authorization model is intentionally changed. Upazila advisors are not part of the target workflow.

## Content Moderation

```mermaid
flowchart LR
  OrganizationAuthor[Authorized Organization Member] --> Draft[Create Blog / Event / Gallery]
  Draft --> Pending
  Pending --> AdminReview[Super Admin Review]
  AdminReview -->|Approve| Public
  AdminReview -->|Reject| NonPublic[Rejected / Non-public]
  AdminEdit[Super Admin-owned content] --> AdminReview
```

Ownership and reviewer metadata are server-derived. Organization users cannot approve their own content by changing request payloads.

## Medical

```mermaid
flowchart LR
  Admin --> Institution
  Institution --> Doctor
  Institution --> Library
  Division --> District --> Upazila
  Upazila --> Institution
  Institution --> PublicMedicalTabs[Medical / Doctors / Library]
```

The API validates geographic ancestry and public Library reads expose published articles only.

## Roles

```mermaid
flowchart TD
  Public --> PublicReads[Approved public reads]
  Public --> PublicRequest[Create/track blood request]
  Donor --> OwnProfile[Own profile, settings and history]
  Donor --> Assignment[Own assignments/donations/posts]
  OrganizationMember --> ScopedDashboard[Authorized organization scope]
  SuperAdmin --> PlatformManagement[Platform-wide governance and moderation]
```

Client-provided user, donor, organization, ownership, role and approval fields are identifiers or input only; the API resolves authority from the authenticated account and database relationships.

## Donor Sharing Card

The donor dashboard generates a client-side social image from same-origin/loaded profile media, name, BD Blood branding and verified donation/achievement context. Download uses an image blob. Share uses the Web Share API with file support when available and falls back to download/link sharing; it does not claim automatic Facebook publishing.

## Removed Workflow

Booking Donation / Donation Appointments are not part of BD Blood. The public organization profile routes users to Request Blood only; donation verification originates from accepted request assignments.

