import {
  ApprovalStatus,
  BlogStatus,
  BloodRequestStatus,
  GovernanceCategory,
  OrganizationMemberStatus,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "../shared/prisma";

const DOMAIN = "@demo.bdblood.local";

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Demo verification failed: ${message}`);
}

async function verify() {
  const [donors, groups, seats, requests, assignments, donations, posts, blogs, events, galleries, institutions, doctors, medicalArticles, ads, faqs, notifications, awards] = await Promise.all([
    prisma.donor.findMany({ where: { email: { endsWith: DOMAIN }, isDeleted: false }, select: { bloodGroup: { select: { groupName: true } }, profileStatus: true, availabilityStatus: true, accountStatus: true, referenceId: true } }),
    prisma.bloodGroup.count({ where: { isDeleted: false } }),
    prisma.organizationMember.findMany({ where: { seatKey: { startsWith: "demo:" }, isDeleted: false, status: OrganizationMemberStatus.ACTIVE }, select: { organizationId: true, category: true } }),
    prisma.bloodRequest.findMany({ where: { referenceCode: { startsWith: "DEMO-" }, isDeleted: false }, select: { id: true, status: true, requiredUnits: true, assignments: { where: { isDeleted: false }, select: { status: true } }, statusHistory: { select: { id: true } }, notifications: { where: { isDeleted: false }, select: { id: true } } } }),
    prisma.requestAssignment.count({ where: { request: { referenceCode: { startsWith: "DEMO-" } }, isDeleted: false } }),
    prisma.bloodDonation.groupBy({ by: ["verificationStatus"], where: { notes: { startsWith: "Demo " }, isDeleted: false }, _count: true }),
    prisma.post.groupBy({ by: ["approvalStatus"], where: { slug: { startsWith: "demo-post-" }, isDeleted: false }, _count: true }),
    prisma.blog.groupBy({ by: ["status"], where: { slug: { startsWith: "demo-blog-" }, isDeleted: false }, _count: true }),
    prisma.event.groupBy({ by: ["approvalStatus"], where: { slug: { startsWith: "demo-event-" }, isDeleted: false }, _count: true }),
    prisma.gallery.groupBy({ by: ["approvalStatus"], where: { slug: { startsWith: "demo-gallery-" }, isDeleted: false }, _count: true }),
    prisma.medicalInstitution.count({ where: { slug: { startsWith: "demo-medical-" }, isDeleted: false } }),
    prisma.doctor.count({ where: { institution: { slug: { startsWith: "demo-medical-" } }, isDeleted: false } }),
    prisma.medicalInformation.count({ where: { institution: { slug: { startsWith: "demo-medical-" } }, isDeleted: false } }),
    prisma.medicalAdvertisement.count({ where: { institution: { slug: { startsWith: "demo-medical-" } }, isDeleted: false } }),
    prisma.faq.count({ where: { question: { in: ["Who can donate blood?", "How often can I donate?", "How are urgent requests handled?", "Is this demo data real?"] }, active: true, isDeleted: false } }),
    prisma.notification.count({ where: { message: { startsWith: "Demo notification" }, isDeleted: false } }),
    prisma.donorAchievement.count({ where: { donor: { email: `o-positive-ready${DOMAIN}` } } }),
  ]);

  const statusSet = new Set(requests.map((item) => item.status));
  const groupSet = new Set(donors.map((item) => item.bloodGroup.groupName));
  const seatCounts = new Map<string, { committee: number; advisor: number }>();
  for (const seat of seats) {
    const key = seat.organizationId ?? "central";
    const current = seatCounts.get(key) ?? { committee: 0, advisor: 0 };
    if (seat.category === GovernanceCategory.COMMITTEE) current.committee += 1;
    else current.advisor += 1;
    seatCounts.set(key, current);
  }
  const approvedPosts = posts.find((item) => item.approvalStatus === ApprovalStatus.APPROVED)?._count ?? 0;
  const central = await prisma.organization.findFirstOrThrow({ where: { canonical: true, level: "CENTRAL", isDeleted: false }, select: { id: true } });
  const centralRoster = await prisma.organizationMember.groupBy({ by: ["category"], where: { organizationId: central.id, status: OrganizationMemberStatus.ACTIVE, isDeleted: false }, _count: true });
  const centralCommittee = centralRoster.find((item) => item.category === GovernanceCategory.COMMITTEE)?._count ?? 0;
  const centralAdvisors = centralRoster.find((item) => item.category === GovernanceCategory.ADVISOR)?._count ?? 0;
  check(groups === 8 && groupSet.size === 8, "all eight blood groups must be represented");
  check(donors.length >= 11, "scenario donor accounts are missing");
  check(donors.some((item) => item.profileStatus === "INCOMPLETE"), "incomplete profile scenario is missing");
  check(donors.some((item) => item.referenceId), "referral relationship is missing");
  check(seats.length === 131, `expected 131 deterministic governance seats, got ${seats.length}`);
  check(centralCommittee === 11 && centralAdvisors === 11, `expected central 11+11 roster, got ${centralCommittee}+${centralAdvisors}`);
  check([...seatCounts.values()].filter((item) => item.committee === 11 && item.advisor === 11).length >= 4, "division/district 11+11 governance scopes are incomplete");
  check([...seatCounts.values()].filter((item) => item.committee === 11 && item.advisor === 0).length >= 2, "two complete Upazila committees are required");
  check([...Object.values(BloodRequestStatus)].filter((status) => status !== BloodRequestStatus.PENDING).every((status) => statusSet.has(status)), "request lifecycle states are incomplete");
  check(requests.every((item) => item.statusHistory.length > 0 && item.notifications.length > 0), "request history/organization notification links are missing");
  check(requests.some((item) => item.requiredUnits === 2 && item.assignments.filter((a) => a.status === "ACCEPTED").length === 2), "two-unit/two-accepted capacity scenario is missing");
  check(assignments >= 6, "assignment and alert scenarios are incomplete");
  for (const status of Object.values(VerificationStatus)) check(donations.some((item) => item.verificationStatus === status), `donation ${status} state is missing`);
  check(approvedPosts >= 10 && posts.some((item) => item.approvalStatus === ApprovalStatus.PENDING) && posts.some((item) => item.approvalStatus === ApprovalStatus.REJECTED), "post publication/moderation mix is incomplete");
  check(blogs.some((item) => item.status === BlogStatus.APPROVED) && blogs.some((item) => item.status === BlogStatus.PENDING) && blogs.some((item) => item.status === BlogStatus.REJECTED), "blog moderation mix is incomplete");
  check(events.length === 3 && galleries.length === 3, "event/gallery moderation states are incomplete");
  check(institutions >= 3 && doctors >= 6 && medicalArticles >= 4 && ads >= 3, "medical directory/library/ad coverage is incomplete");
  check(faqs === 4 && notifications >= 8 && awards > 0, "FAQ, notification, or achievement coverage is incomplete");

  console.log("Demo data verification passed", { donors: donors.length, governanceSeats: seats.length, requests: requests.length, assignments, approvedPosts, institutions, doctors, medicalArticles, ads, faqs, notifications, awards });
}

verify().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
