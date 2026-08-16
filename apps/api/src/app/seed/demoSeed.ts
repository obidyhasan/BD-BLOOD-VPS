import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import {
  AccountStatus,
  AdStatus,
  AffiliationSource,
  ApprovalStatus,
  ArticleStatus,
  AvailabilityStatus,
  BlogStatus,
  BloodRequestStatus,
  BloodRequestType,
  EventType,
  GovernanceCategory,
  NotificationPriority,
  NotificationType,
  OrganizationMemberStatus,
  ParticipationType,
  PositionLevel,
  PositionStatus,
  PostType,
  PostVisibility,
  ReportStatus,
  ReportTargetType,
  RequestAssignmentStatus,
  Role,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "../shared/prisma";
import { seedGeoData } from "./geoSeed";
import { seedBloodGroups } from "./bloodGroupSeed";
import { seedAchievements } from "./achievementSeed";
import { seedCanonicalOrganizations } from "./organizationSeed";
import { seedSuperAdmin } from "./adminSeed";

const DEMO_FLAG = "--confirm-bd-blood-demo-seed";
const DEMO_PASSWORD = "Demo@BDblood2026!";
const DEMO_EMAIL_DOMAIN = "demo.bdblood.local";
const IMAGE = "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80";

function id(key: string): string {
  const hex = createHash("sha256").update(`bd-blood-demo:${key}`).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20)}`;
}

function at(days: number, hour = 10): Date {
  const value = new Date();
  value.setHours(hour, 0, 0, 0);
  value.setDate(value.getDate() + days);
  return value;
}

function addMonths(value: Date, months: number): Date {
  const result = new Date(value);
  result.setMonth(result.getMonth() + months);
  return result;
}

function assertSafeEnvironment(): void {
  if (!process.argv.includes(DEMO_FLAG)) {
    throw new Error(`Demo seed requires the dedicated command flag ${DEMO_FLAG}.`);
  }
  if ((process.env.NODE_ENV || "").toLowerCase() === "production") {
    throw new Error("Refusing to seed demo data while NODE_ENV=production.");
  }
  const url = process.env.DATABASE_URL;
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) {
    throw new Error("A PostgreSQL DATABASE_URL is required for the demo seed.");
  }
}

async function upsertDonor(input: {
  key: string;
  name: string;
  phoneIndex: number;
  bloodGroupId: string;
  location: Location;
  password: string;
  complete?: boolean;
  available?: boolean;
  verified?: boolean;
  accountStatus?: AccountStatus;
  referenceId?: string | null;
}) {
  const donorId = id(`donor:${input.key}`);
  const complete = input.complete ?? true;
  const verified = input.verified ?? true;
  const email = `${input.key}@${DEMO_EMAIL_DOMAIN}`;
  const common = {
    fullName: input.name,
    phone: `0131${String(input.phoneIndex).padStart(7, "0")}`,
    email,
    password: input.password,
    bloodGroupId: input.bloodGroupId,
    role: Role.DONOR,
    divisionId: complete ? input.location.divisionId : null,
    districtId: complete ? input.location.districtId : null,
    upazilaId: complete ? input.location.upazilaId : null,
    availabilityStatus: input.available === false ? AvailabilityStatus.UNAVAILABLE : AvailabilityStatus.AVAILABLE,
    profilePhoto: complete ? IMAGE : null,
    bio: complete ? `Demo volunteer supporting safe blood donation in ${input.location.upazilaName}.` : null,
    slug: `demo-${input.key}`,
    accountStatus: input.accountStatus ?? AccountStatus.ACTIVE,
    profileStatus: complete ? "COMPLETE" as const : "INCOMPLETE" as const,
    profileCompletedAt: complete ? at(-90) : null,
    isVerified: verified,
    verifiedAt: verified ? at(-100) : null,
    phoneVerifiedAt: complete ? at(-100) : null,
    referenceId: input.referenceId ?? null,
    notifyInApp: true,
    notifySms: input.key !== "settings-email",
    notifyEmail: input.key === "settings-email",
    isDeleted: false,
    deletedAt: null,
  };
  return prisma.donor.upsert({ where: { id: donorId }, create: { id: donorId, ...common }, update: common });
}

type Location = {
  divisionId: string;
  districtId: string;
  upazilaId: string;
  divisionName: string;
  districtName: string;
  upazilaName: string;
  organizationId: string;
};

async function seedDemo() {
  assertSafeEnvironment();
  console.log("Preparing reference data required by the isolated demo dataset...");
  await seedGeoData();
  await seedBloodGroups();
  await seedAchievements();
  await seedCanonicalOrganizations();
  await seedSuperAdmin();

  const [groups, upazilaOrganizations, central, divisions, districts, admin] = await Promise.all([
    prisma.bloodGroup.findMany({ where: { isDeleted: false }, orderBy: { groupName: "asc" } }),
    prisma.organization.findMany({
      where: { canonical: true, level: "UPAZILA", isDeleted: false },
      include: { division: true, district: true, upazila: true },
      orderBy: { name: "asc" },
    }),
    prisma.organization.findFirstOrThrow({ where: { canonical: true, level: "CENTRAL", isDeleted: false } }),
    prisma.organization.findMany({ where: { canonical: true, level: "DIVISION", isDeleted: false }, orderBy: { name: "asc" }, take: 2 }),
    prisma.organization.findMany({ where: { canonical: true, level: "DISTRICT", isDeleted: false }, orderBy: { name: "asc" }, take: 2 }),
    prisma.donor.findFirstOrThrow({ where: { role: Role.ADMIN, isDeleted: false } }),
  ]);
  if (groups.length !== 8 || upazilaOrganizations.length < 2 || divisions.length < 2 || districts.length < 2) {
    throw new Error("Reference geography, organizations, or all eight blood groups are missing.");
  }
  const locations: Location[] = upazilaOrganizations.slice(0, 4).map((org) => ({
    divisionId: org.divisionId,
    districtId: org.districtId,
    upazilaId: org.upazilaId,
    divisionName: org.division.name,
    districtName: org.district.name,
    upazilaName: org.upazila.name,
    organizationId: org.id,
  }));
  const primary = locations[0];
  const secondary = locations[1];
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  await prisma.donor.update({
    where: { id: admin.id },
    data: {
      fullName: "BD Blood Demo Super Admin",
      password,
      phone: "01310000000",
      divisionId: primary.divisionId,
      districtId: primary.districtId,
      upazilaId: primary.upazilaId,
      profilePhoto: IMAGE,
      bio: "Demo Super Admin for end-to-end QA.",
      slug: "demo-super-admin",
      profileStatus: "COMPLETE",
      profileCompletedAt: at(-120),
      phoneVerifiedAt: at(-120),
      isVerified: true,
      verifiedAt: at(-120),
      accountStatus: AccountStatus.ACTIVE,
      isDeleted: false,
      deletedAt: null,
    },
  });

  const committeeNames = ["Chairperson", "Vice Chairperson", "General Secretary", "Joint Secretary", "Organizing Secretary", "Finance Secretary", "Publicity Secretary", "Medical Affairs Secretary", "Volunteer Coordinator", "Training Secretary", "Executive Member"];
  const advisorNames = ["Chief Advisor", "Medical Advisor", "Legal Advisor", "Community Advisor", "Youth Advisor", "Finance Advisor", "Technology Advisor", "Media Advisor", "Training Advisor", "Emergency Response Advisor", "Public Health Advisor"];
  const committeePositions = [];
  const advisorPositions = [];
  for (let index = 0; index < 11; index += 1) {
    committeePositions.push(await prisma.organizationPosition.upsert({
      where: { id: id(`position:committee:${index}`) },
      create: { id: id(`position:committee:${index}`), positionName: committeeNames[index], positionOrder: index + 1, level: PositionLevel.EXECUTIVE, positionStatus: PositionStatus.MAIN_ROLE },
      update: { positionName: committeeNames[index], positionOrder: index + 1, level: PositionLevel.EXECUTIVE, positionStatus: PositionStatus.MAIN_ROLE, isDeleted: false, deletedAt: null },
    }));
    advisorPositions.push(await prisma.organizationPosition.upsert({
      where: { id: id(`position:advisor:${index}`) },
      create: { id: id(`position:advisor:${index}`), positionName: advisorNames[index], positionOrder: index + 1, level: PositionLevel.MANAGEMENT, positionStatus: PositionStatus.ACTIVE },
      update: { positionName: advisorNames[index], positionOrder: index + 1, level: PositionLevel.MANAGEMENT, positionStatus: PositionStatus.ACTIVE, isDeleted: false, deletedAt: null },
    }));
  }

  let phoneIndex = 1;
  const governanceScopes = [
    { key: "central", orgId: central.id, location: primary, committee: 10, advisors: 11 },
    ...divisions.map((org, i) => ({ key: `division-${i + 1}`, orgId: org.id, location: locations[i], committee: 11, advisors: 11 })),
    ...districts.map((org, i) => ({ key: `district-${i + 1}`, orgId: org.id, location: locations[i], committee: 11, advisors: 11 })),
    { key: "upazila-1", orgId: primary.organizationId, location: primary, committee: 11, advisors: 0 },
    { key: "upazila-2", orgId: secondary.organizationId, location: secondary, committee: 11, advisors: 0 },
  ];
  const governanceDonors: Awaited<ReturnType<typeof upsertDonor>>[] = [];
  for (const scope of governanceScopes) {
    for (let index = 0; index < scope.committee + scope.advisors; index += 1) {
      const advisor = index >= scope.committee;
      const positionIndex = advisor ? index - scope.committee : index + (scope.key === "central" ? 1 : 0);
      const key = `member-${scope.key}-${advisor ? "advisor" : "committee"}-${index + 1}`;
      const donor = await upsertDonor({ key, name: `${advisor ? advisorNames[positionIndex] : committeeNames[positionIndex]} — ${scope.location.upazilaName}`, phoneIndex: phoneIndex++, bloodGroupId: groups[phoneIndex % groups.length].id, location: scope.location, password });
      governanceDonors.push(donor);
      const position = advisor ? advisorPositions[positionIndex] : committeePositions[positionIndex];
      await prisma.organizationMember.upsert({
        where: { donorId: donor.id },
        create: { id: id(`membership:${key}`), organizationId: scope.orgId, donorId: donor.id, positionId: position.id, category: advisor ? GovernanceCategory.ADVISOR : GovernanceCategory.COMMITTEE, seatKey: `demo:${scope.key}:${advisor ? "advisor" : "committee"}:${index}`, appointedById: admin.id, joinedAt: at(-180), activatedAt: at(-170), status: OrganizationMemberStatus.ACTIVE },
        update: { organizationId: scope.orgId, positionId: position.id, category: advisor ? GovernanceCategory.ADVISOR : GovernanceCategory.COMMITTEE, seatKey: `demo:${scope.key}:${advisor ? "advisor" : "committee"}:${index}`, appointedById: admin.id, activatedAt: at(-170), endedAt: null, status: OrganizationMemberStatus.ACTIVE, isDeleted: false, deletedAt: null },
      });
    }
  }

  const scenarioSpecs = [
    { key: "a-positive-ready", name: "Arif Rahman", group: "A+", complete: true, available: true, verified: true },
    { key: "a-negative-cooldown", name: "Nusrat Jahan", group: "A-", complete: true, available: false, verified: true },
    { key: "b-positive-ready", name: "Tanvir Ahmed", group: "B+", complete: true, available: true, verified: true },
    { key: "b-negative-incomplete", name: "Sadia Islam", group: "B-", complete: false, available: true, verified: false },
    { key: "ab-positive-ready", name: "Mahmud Hasan", group: "AB+", complete: true, available: true, verified: true },
    { key: "ab-negative-unverified", name: "Farzana Akter", group: "AB-", complete: true, available: true, verified: false },
    { key: "o-positive-ready", name: "Rafiul Karim", group: "O+", complete: true, available: true, verified: true },
    { key: "o-negative-ready", name: "Mehjabin Chowdhury", group: "O-", complete: true, available: true, verified: true },
    { key: "suspended", name: "Suspended Demo Donor", group: "A+", complete: true, available: true, verified: true, accountStatus: AccountStatus.SUSPENDED },
    { key: "inactive", name: "Inactive Demo Donor", group: "B+", complete: true, available: true, verified: true, accountStatus: AccountStatus.INACTIVE },
    { key: "settings-email", name: "Email Preference Donor", group: "O+", complete: true, available: true, verified: true },
  ];
  const scenarioDonors: Record<string, Awaited<ReturnType<typeof upsertDonor>>> = {};
  for (const [index, spec] of scenarioSpecs.entries()) {
    const ref = index >= 2 ? scenarioDonors[scenarioSpecs[index % 2].key]?.id : admin.id;
    const donor = await upsertDonor({ ...spec, phoneIndex: phoneIndex++, bloodGroupId: groups.find((g) => g.groupName === spec.group)!.id, location: locations[index % locations.length], password, referenceId: ref });
    scenarioDonors[spec.key] = donor;
  }
  for (const donor of [...governanceDonors, ...Object.values(scenarioDonors)]) {
    const location = locations.find((item) => item.upazilaId === donor.upazilaId) ?? primary;
    if (donor.profileStatus === "COMPLETE") {
      await prisma.donorOrganizationAffiliation.upsert({
        where: { donorId: donor.id },
        create: { id: id(`affiliation:${donor.id}`), donorId: donor.id, organizationId: location.organizationId, upazilaId: location.upazilaId, source: AffiliationSource.ADMIN, active: true, assignedAt: at(-100) },
        update: { organizationId: location.organizationId, upazilaId: location.upazilaId, source: AffiliationSource.ADMIN, active: true, assignedAt: at(-100) },
      });
    }
  }
  await prisma.donorOrganizationAffiliation.upsert({
    where: { donorId: admin.id },
    create: { id: id("affiliation:admin"), donorId: admin.id, organizationId: primary.organizationId, upazilaId: primary.upazilaId, source: AffiliationSource.ADMIN, active: true },
    update: { organizationId: primary.organizationId, upazilaId: primary.upazilaId, active: true },
  });

  for (const [groupIndex, group] of groups.entries()) {
    await prisma.organizationBloodInventory.upsert({
      where: { organizationId_bloodGroupId: { organizationId: primary.organizationId, bloodGroupId: group.id } },
      create: { id: id(`inventory:primary:${group.groupName}`), organizationId: primary.organizationId, bloodGroupId: group.id, availableUnits: groupIndex + 1, lastUpdated: at(0) },
      update: { availableUnits: groupIndex + 1, lastUpdated: at(0), isDeleted: false, deletedAt: null },
    });
  }

  const requestStatuses = [BloodRequestStatus.SUBMITTED, BloodRequestStatus.PROCESSING, BloodRequestStatus.DONOR_FOUND, BloodRequestStatus.FULFILLED, BloodRequestStatus.COMPLETED, BloodRequestStatus.CANCELLED, BloodRequestStatus.REJECTED];
  const requests = [];
  for (const [index, status] of requestStatuses.entries()) {
    const loc = locations[index % locations.length];
    const requestId = id(`request:${status.toLowerCase()}`);
    const timestamps = {
      acceptedById: status === BloodRequestStatus.SUBMITTED ? null : admin.id,
      acceptedAt: status === BloodRequestStatus.SUBMITTED ? null : at(-8 + index),
      donorFoundAt: status === BloodRequestStatus.DONOR_FOUND || status === BloodRequestStatus.FULFILLED || status === BloodRequestStatus.COMPLETED ? at(-7 + index) : null,
      fulfilledAt: status === BloodRequestStatus.FULFILLED || status === BloodRequestStatus.COMPLETED ? at(-6 + index) : null,
      handoverCompletedAt: status === BloodRequestStatus.COMPLETED ? at(-5 + index) : null,
      completedById: status === BloodRequestStatus.COMPLETED ? admin.id : null,
      cancelledAt: status === BloodRequestStatus.CANCELLED ? at(-2) : null,
      cancelledById: status === BloodRequestStatus.CANCELLED ? admin.id : null,
      cancellationReason: status === BloodRequestStatus.CANCELLED ? "Patient transferred to another facility." : null,
      rejectedAt: status === BloodRequestStatus.REJECTED ? at(-1) : null,
      rejectedById: status === BloodRequestStatus.REJECTED ? admin.id : null,
      rejectionReason: status === BloodRequestStatus.REJECTED ? "Duplicate demo request." : null,
    };
    const data = { referenceCode: `DEMO-${String(index + 1).padStart(4, "0")}`, requesterName: ["Ayesha Begum", "Imran Hossain", "Shila Rani", "Abdul Karim"][index % 4], requesterPhone: `0179000000${index}`, bloodGroupId: groups[index % groups.length].id, hospitalName: ["Dhaka Medical College Hospital", "Chattogram Medical College Hospital", "Square Hospital", "Upazila Health Complex"][index % 4], divisionId: loc.divisionId, districtId: loc.districtId, upazilaId: loc.upazilaId, organizationId: loc.organizationId, handledByOrganizationId: status === BloodRequestStatus.SUBMITTED ? null : loc.organizationId, requiredUnits: index === 2 ? 2 : 1, requestType: index % 2 ? BloodRequestType.GENERAL : BloodRequestType.URGENT, message: "Demo-only request for end-to-end workflow validation.", status, confirmedAt: status === BloodRequestStatus.SUBMITTED ? null : at(-9 + index), isDeleted: false, deletedAt: null, ...timestamps };
    requests.push(await prisma.bloodRequest.upsert({ where: { id: requestId }, create: { id: requestId, ...data }, update: data }));
    await prisma.bloodRequestStatusHistory.upsert({
      where: { id: id(`request-history:${status.toLowerCase()}`) },
      create: { id: id(`request-history:${status.toLowerCase()}`), requestId, previousStatus: null, newStatus: status, changedById: admin.id, reason: "Deterministic demo lifecycle snapshot.", createdAt: at(-10 + index) },
      update: { requestId, newStatus: status, changedById: admin.id, reason: "Deterministic demo lifecycle snapshot." },
    });
    await prisma.bloodRequestNotification.upsert({
      where: { requestId_organizationId: { requestId, organizationId: loc.organizationId } },
      create: { id: id(`request-notification:${status.toLowerCase()}`), requestId, organizationId: loc.organizationId, smsSent: false, notifiedAt: at(-9 + index) },
      update: { smsSent: false, notifiedAt: at(-9 + index), isDeleted: false, deletedAt: null },
    });
  }

  const assignmentDonors = [scenarioDonors["a-positive-ready"], scenarioDonors["b-positive-ready"], scenarioDonors["o-positive-ready"], scenarioDonors["o-negative-ready"]];
  const assignmentSpecs = [
    { request: requests[1], donor: assignmentDonors[0], status: RequestAssignmentStatus.ACCEPTED },
    { request: requests[2], donor: assignmentDonors[1], status: RequestAssignmentStatus.ACCEPTED },
    { request: requests[2], donor: assignmentDonors[2], status: RequestAssignmentStatus.ACCEPTED },
    { request: requests[3], donor: assignmentDonors[3], status: RequestAssignmentStatus.DONATED },
    { request: requests[5], donor: assignmentDonors[0], status: RequestAssignmentStatus.CANCELLED },
    { request: requests[1], donor: assignmentDonors[3], status: RequestAssignmentStatus.DECLINED },
    { request: requests[4], donor: scenarioDonors["ab-positive-ready"], status: RequestAssignmentStatus.DONATED },
  ];
  const assignments = [];
  for (const [index, spec] of assignmentSpecs.entries()) {
    const assignmentId = id(`assignment:${index}`);
    assignments.push(await prisma.requestAssignment.upsert({
      where: { id: assignmentId },
      create: { id: assignmentId, requestId: spec.request.id, donorId: spec.donor.id, status: spec.status, assignedById: admin.id, bagUnits: 1, assignedAt: at(-8 + index), notifiedAt: at(-8 + index), acceptedAt: spec.status === RequestAssignmentStatus.ACCEPTED || spec.status === RequestAssignmentStatus.DONATED ? at(-7 + index) : null, declinedAt: spec.status === RequestAssignmentStatus.DECLINED ? at(-6) : null, cancelledAt: spec.status === RequestAssignmentStatus.CANCELLED ? at(-4) : null, donatedAt: spec.status === RequestAssignmentStatus.DONATED ? at(-3) : null, declineReason: spec.status === RequestAssignmentStatus.DECLINED ? "Outside travel radius." : null },
      update: { requestId: spec.request.id, donorId: spec.donor.id, status: spec.status, assignedById: admin.id, notifiedAt: at(-8 + index), acceptedAt: spec.status === RequestAssignmentStatus.ACCEPTED || spec.status === RequestAssignmentStatus.DONATED ? at(-7 + index) : null, declinedAt: spec.status === RequestAssignmentStatus.DECLINED ? at(-6) : null, cancelledAt: spec.status === RequestAssignmentStatus.CANCELLED ? at(-4) : null, donatedAt: spec.status === RequestAssignmentStatus.DONATED ? at(-3) : null, isDeleted: false, deletedAt: null },
    }));
    await prisma.bloodRequestDonorAlert.upsert({
      where: { requestId_donorId: { requestId: spec.request.id, donorId: spec.donor.id } },
      create: { id: id(`donor-alert:${index}`), requestId: spec.request.id, donorId: spec.donor.id, smsSent: false, notifiedAt: at(-8 + index) },
      update: { smsSent: false, notifiedAt: at(-8 + index) },
    });
  }

  const donationSpecs = [
    { key: "linked", donor: assignmentDonors[3], status: VerificationStatus.VERIFIED, assignmentId: assignments[3].id, days: -3 },
    { key: "pending", donor: assignmentDonors[0], status: VerificationStatus.PENDING, assignmentId: null, days: -2 },
    { key: "rejected", donor: assignmentDonors[1], status: VerificationStatus.REJECTED, assignmentId: null, days: -20 },
    { key: "history-1", donor: assignmentDonors[2], status: VerificationStatus.VERIFIED, assignmentId: null, days: -150 },
    { key: "history-2", donor: assignmentDonors[2], status: VerificationStatus.VERIFIED, assignmentId: null, days: -300 },
    { key: "history-3", donor: assignmentDonors[2], status: VerificationStatus.VERIFIED, assignmentId: null, days: -450 },
    { key: "post-eligible", donor: assignmentDonors[0], status: VerificationStatus.VERIFIED, assignmentId: null, days: -120 },
    { key: "completed-linked", donor: scenarioDonors["ab-positive-ready"], status: VerificationStatus.VERIFIED, assignmentId: assignments[6].id, days: -40 },
    { key: "cooldown", donor: scenarioDonors["a-negative-cooldown"], status: VerificationStatus.VERIFIED, assignmentId: null, days: -12 },
  ];
  const donations = [];
  for (const spec of donationSpecs) {
    const loc = locations.find((item) => item.upazilaId === spec.donor.upazilaId) ?? primary;
    const data = { donorId: spec.donor.id, recipientName: "Demo Recipient", hospitalName: "BD Blood Demo Hospital", divisionId: loc.divisionId, districtId: loc.districtId, upazilaId: loc.upazilaId, organizationId: loc.organizationId, requestAssignmentId: spec.assignmentId, donationDate: at(spec.days), verificationStatus: spec.status, verifiedBy: spec.status === VerificationStatus.PENDING ? null : admin.id, verifiedAt: spec.status === VerificationStatus.PENDING ? null : at(spec.days + 1), notes: `Demo ${spec.status.toLowerCase()} donation.`, isDeleted: false, deletedAt: null };
    donations.push(await prisma.bloodDonation.upsert({ where: { id: id(`donation:${spec.key}`) }, create: { id: id(`donation:${spec.key}`), ...data }, update: data }));
  }
  const demoProjectionDonors = await prisma.donor.findMany({ where: { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` }, isDeleted: false }, select: { id: true } });
  for (const donor of demoProjectionDonors) {
    const latest = await prisma.bloodDonation.findFirst({ where: { donorId: donor.id, verificationStatus: VerificationStatus.VERIFIED, isDeleted: false }, orderBy: { donationDate: "desc" }, select: { donationDate: true } });
    const nextEligible = latest ? addMonths(latest.donationDate, 3) : null;
    await prisma.donor.update({ where: { id: donor.id }, data: { lastDonationDate: latest?.donationDate ?? null, nextEligibleDonationDate: nextEligible, availabilityStatus: nextEligible && nextEligible > new Date() ? AvailabilityStatus.UNAVAILABLE : AvailabilityStatus.AVAILABLE } });
  }

  const postTypes = [PostType.DONATION, PostType.EVENT, PostType.ANNOUNCEMENT, PostType.SOCIAL_ACTIVITY, PostType.GENERAL, PostType.RECAP, PostType.HELP_REQUEST, PostType.EMERGENCY, PostType.URGENT, PostType.DONATION];
  const posts = [];
  for (let index = 0; index < 12; index += 1) {
    const approved = index < 10;
    const rejected = index === 11;
    const data = { donorId: index ? governanceDonors[index].id : assignmentDonors[0].id, organizationId: index === 9 ? secondary.organizationId : primary.organizationId, donationId: index === 0 ? donations[6].id : null, postType: postTypes[index % postTypes.length], visibility: index === 8 ? PostVisibility.PRIVATE : PostVisibility.PUBLIC, isWork: index < 6, title: ["Verified donation story", "Community blood camp success", "Volunteer orientation completed", "Emergency response team update", "Donor recognition gathering", "Hospital partnership milestone", "Winter awareness campaign", "Youth volunteer meetup", "Private committee note", "Second branch success story", "Pending organization story", "Rejected duplicate story"][index], content: "This is realistic, demo-safe Bangladesh-focused content created for visual and workflow QA. No real patient or donor data is used.", images: [IMAGE], approvalStatus: approved ? ApprovalStatus.APPROVED : rejected ? ApprovalStatus.REJECTED : ApprovalStatus.PENDING, slug: `demo-post-${index + 1}`, isDeleted: false, deletedAt: null };
    posts.push(await prisma.post.upsert({ where: { id: id(`post:${index}`) }, create: { id: id(`post:${index}`), ...data }, update: data }));
  }
  await prisma.postLike.upsert({ where: { postId_donorId: { postId: posts[0].id, donorId: assignmentDonors[1].id } }, create: { id: id("like:1"), postId: posts[0].id, donorId: assignmentDonors[1].id }, update: {} });
  await prisma.postComment.upsert({ where: { id: id("comment:1") }, create: { id: id("comment:1"), postId: posts[0].id, donorId: assignmentDonors[2].id, content: "Thank you for supporting the community." }, update: { content: "Thank you for supporting the community.", isDeleted: false, deletedAt: null } });

  for (let index = 0; index < 4; index += 1) {
    const status = [ApprovalStatus.APPROVED, ApprovalStatus.APPROVED, ApprovalStatus.PENDING, ApprovalStatus.REJECTED][index];
    const event = await prisma.event.upsert({
      where: { id: id(`event:${index}`) },
      create: { id: id(`event:${index}`), organizationId: index % 2 ? secondary.organizationId : primary.organizationId, title: ["Dhaka Community Blood Camp", "Volunteer Safety Workshop", "Pending Awareness Session", "Rejected Duplicate Camp"][index], description: "Demo event for calendar, moderation, ownership, and detail-page QA.", eventType: [EventType.BLOOD_CAMP, EventType.WORKSHOP, EventType.AWARENESS, EventType.DONATION_CAMP][index], eventDate: at(index < 3 ? 7 + index * 7 : -10), eventTime: "10:00 AM – 4:00 PM", slots: `${40 + index * 10}`, divisionId: locations[index % 2].divisionId, districtId: locations[index % 2].districtId, upazilaId: locations[index % 2].upazilaId, locationDetails: `${locations[index % 2].upazilaName} Community Centre`, createdById: governanceDonors[index].id, approvalStatus: status, reviewedById: status === ApprovalStatus.PENDING ? null : admin.id, reviewedAt: status === ApprovalStatus.PENDING ? null : at(-2), slug: `demo-event-${index + 1}` },
      update: { approvalStatus: status, eventDate: at(index < 3 ? 7 + index * 7 : -10), reviewedById: status === ApprovalStatus.PENDING ? null : admin.id, reviewedAt: status === ApprovalStatus.PENDING ? null : at(-2), isDeleted: false, deletedAt: null },
    });
    if (index < 2) await prisma.eventParticipant.upsert({ where: { eventId_donorId: { eventId: event.id, donorId: assignmentDonors[index].id } }, create: { id: id(`participant:${index}`), eventId: event.id, donorId: assignmentDonors[index].id, participationType: index ? ParticipationType.VOLUNTEER : ParticipationType.DONOR }, update: { participationType: index ? ParticipationType.VOLUNTEER : ParticipationType.DONOR, isDeleted: false, deletedAt: null } });
  }

  for (let index = 0; index < 4; index += 1) {
    const status = [BlogStatus.APPROVED, BlogStatus.APPROVED, BlogStatus.PENDING, BlogStatus.REJECTED][index];
    await prisma.blog.upsert({ where: { id: id(`blog:${index}`) }, create: { id: id(`blog:${index}`), title: ["Preparing for Your First Blood Donation", "Why Regular Donor Networks Matter", "Pending Volunteer Field Note", "Rejected Duplicate Article"][index], slug: `demo-blog-${index + 1}`, content: "Demo educational article covering preparation, hydration, screening, rest, and safe community coordination in Bangladesh.", coverImage: IMAGE, authorId: governanceDonors[index].id, organizationId: index === 1 ? secondary.organizationId : primary.organizationId, status, reads: 25 + index * 17, publishedAt: status === BlogStatus.APPROVED ? at(-10 + index) : null, reviewedById: status === BlogStatus.PENDING ? null : admin.id, reviewedAt: status === BlogStatus.PENDING ? null : at(-5) }, update: { status, reads: 25 + index * 17, publishedAt: status === BlogStatus.APPROVED ? at(-10 + index) : null, reviewedById: status === BlogStatus.PENDING ? null : admin.id, reviewedAt: status === BlogStatus.PENDING ? null : at(-5), isDeleted: false, deletedAt: null } });
  }
  for (let index = 0; index < 4; index += 1) {
    const status = [ApprovalStatus.APPROVED, ApprovalStatus.APPROVED, ApprovalStatus.PENDING, ApprovalStatus.REJECTED][index];
    await prisma.gallery.upsert({ where: { id: id(`gallery:${index}`) }, create: { id: id(`gallery:${index}`), title: ["Homepage Blood Camp Highlights", "Volunteer Team in Action", "Pending Branch Album", "Rejected Duplicate Album"][index], description: "Demo gallery album for publication and moderation QA.", category: index ? "Organization" : "Homepage", slug: `demo-gallery-${index + 1}`, coverImage: IMAGE, images: [IMAGE, IMAGE], isPublished: status === ApprovalStatus.APPROVED, isFeatured: index === 0, sortOrder: index + 1, organizationId: index === 0 ? null : primary.organizationId, createdById: index === 0 ? admin.id : governanceDonors[index].id, approvalStatus: status, reviewedById: status === ApprovalStatus.PENDING ? null : admin.id, reviewedAt: status === ApprovalStatus.PENDING ? null : at(-3) }, update: { isPublished: status === ApprovalStatus.APPROVED, isFeatured: index === 0, approvalStatus: status, reviewedById: status === ApprovalStatus.PENDING ? null : admin.id, reviewedAt: status === ApprovalStatus.PENDING ? null : at(-3), isDeleted: false, deletedAt: null } });
  }

  const institutions = [];
  for (let index = 0; index < 3; index += 1) {
    const loc = locations[index];
    institutions.push(await prisma.medicalInstitution.upsert({ where: { id: id(`institution:${index}`) }, create: { id: id(`institution:${index}`), name: ["BD Blood Demo Medical College Hospital", "Demo Upazila Health Complex", "Demo Community Diagnostic Centre"][index], type: ["Government Hospital", "Upazila Health Complex", "Diagnostic Centre"][index], phone: `0961000000${index}`, address: `${loc.upazilaName}, ${loc.districtName}`, logo: IMAGE, coverImage: IMAGE, divisionId: loc.divisionId, districtId: loc.districtId, upazilaId: loc.upazilaId, openStatus: index === 2 ? "Open until 10:00 PM" : "Open 24 hours", slug: `demo-medical-${index + 1}` }, update: { openStatus: index === 2 ? "Open until 10:00 PM" : "Open 24 hours", isDeleted: false, deletedAt: null } }));
    for (let doctorIndex = 0; doctorIndex < 2; doctorIndex += 1) await prisma.doctor.upsert({ where: { id: id(`doctor:${index}:${doctorIndex}`) }, create: { id: id(`doctor:${index}:${doctorIndex}`), institutionId: institutions[index].id, name: ["Dr. Samira Haque", "Dr. Faisal Mahmud", "Dr. Runa Laila", "Dr. Kabir Hossain", "Dr. Nusrat Sultana", "Dr. Tarek Aziz"][index * 2 + doctorIndex], specialization: doctorIndex ? "Transfusion Medicine" : "Internal Medicine", phone: `01880000${index}${doctorIndex}0`, visitingHours: doctorIndex ? "Sat–Thu, 5:00 PM–8:00 PM" : "Sat–Thu, 9:00 AM–2:00 PM", experience: `${8 + index * 3 + doctorIndex} years` }, update: { institutionId: institutions[index].id, isDeleted: false, deletedAt: null } });
  }
  for (let index = 0; index < 4; index += 1) await prisma.medicalInformation.upsert({ where: { id: id(`medical-info:${index}`) }, create: { id: id(`medical-info:${index}`), institutionId: institutions[index % institutions.length].id, title: ["Before donating blood", "After-donation care", "Understanding blood groups", "Draft emergency checklist"][index], content: "Demo medical library content: eat a balanced meal, drink water, complete screening honestly, and follow clinical staff instructions.", category: ["Preparation", "Aftercare", "Education", "Emergency"][index], createdBy: admin.id, status: index === 3 ? ArticleStatus.DRAFT : ArticleStatus.PUBLISHED }, update: { status: index === 3 ? ArticleStatus.DRAFT : ArticleStatus.PUBLISHED, isDeleted: false, deletedAt: null } });
  for (let index = 0; index < 3; index += 1) await prisma.medicalAdvertisement.upsert({ where: { id: id(`medical-ad:${index}`) }, create: { id: id(`medical-ad:${index}`), title: ["Free demo donor screening", "Demo health check package", "Inactive archived campaign"][index], imageUrl: IMAGE, institutionId: institutions[index].id, redirectUrl: `/medical/${institutions[index].slug}`, startDate: at(index === 2 ? -60 : -5), endDate: at(index === 2 ? -1 : 30), status: index === 2 ? AdStatus.INACTIVE : AdStatus.ACTIVE, createdBy: admin.id }, update: { startDate: at(index === 2 ? -60 : -5), endDate: at(index === 2 ? -1 : 30), status: index === 2 ? AdStatus.INACTIVE : AdStatus.ACTIVE, isDeleted: false, deletedAt: null } });

  const faqData = [
    ["Who can donate blood?", "Healthy adults who meet the current screening criteria may donate after clinical assessment.", "Donation"],
    ["How often can I donate?", "BD Blood applies a three-month eligibility interval after a verified donation.", "Eligibility"],
    ["How are urgent requests handled?", "Nearby matching donors and the responsible organization can be notified in-app.", "Requests"],
    ["Is this demo data real?", "No. All demo names, requests, and medical records are fictional and safe for testing.", "Demo"],
  ];
  for (const [index, faq] of faqData.entries()) await prisma.faq.upsert({ where: { id: id(`faq:${index}`) }, create: { id: id(`faq:${index}`), question: faq[0], answer: faq[1], category: faq[2], active: true, order: index + 1 }, update: { question: faq[0], answer: faq[1], category: faq[2], active: true, order: index + 1, isDeleted: false, deletedAt: null } });

  const notificationTypes = [NotificationType.BLOOD_REQUEST, NotificationType.BLOOD, NotificationType.ORG, NotificationType.POST, NotificationType.SYSTEM];
  for (let index = 0; index < 8; index += 1) await prisma.notification.upsert({ where: { id: id(`notification:${index}`) }, create: { id: id(`notification:${index}`), donorId: index < 4 ? assignmentDonors[index % assignmentDonors.length].id : admin.id, title: ["Urgent matching request", "Donation verified", "Organization appointment", "Post approved", "Pending review reminder", "New request queue item", "Achievement unlocked", "System demo notice"][index], message: "Demo notification for read/unread, priority, linking, and dashboard QA.", type: notificationTypes[index % notificationTypes.length], priority: [NotificationPriority.HIGH, NotificationPriority.MEDIUM, NotificationPriority.LOW, NotificationPriority.ROUTINE][index % 4], relatedId: index < requests.length ? requests[index].id : null, relatedType: index < requests.length ? "BLOOD_REQUEST" : null, isRead: index % 3 === 0 }, update: { isRead: index % 3 === 0, isDeleted: false, deletedAt: null } });

  await prisma.report.upsert({ where: { id: id("report:pending") }, create: { id: id("report:pending"), reportedBy: assignmentDonors[0].id, targetType: ReportTargetType.POST, targetId: posts[11].id, reason: "Demo moderation queue report.", status: ReportStatus.PENDING }, update: { status: ReportStatus.PENDING, isDeleted: false, deletedAt: null } });
  await prisma.contactMessage.upsert({ where: { id: id("contact:new") }, create: { id: id("contact:new"), name: "Demo Visitor", email: `visitor@${DEMO_EMAIL_DOMAIN}`, message: "Demo contact inbox item for admin dashboard QA.", status: "NEW" }, update: { status: "NEW" } });

  const achievements = await prisma.achievement.findMany({ where: { active: true, isDeleted: false }, orderBy: { thresholdValue: "asc" } });
  for (const donor of demoProjectionDonors) {
    const [verified, total] = await Promise.all([
      prisma.bloodDonation.count({ where: { donorId: donor.id, verificationStatus: VerificationStatus.VERIFIED, isDeleted: false } }),
      prisma.bloodDonation.count({ where: { donorId: donor.id, isDeleted: false } }),
    ]);
    for (const achievement of achievements.filter((item) => (item.thresholdType === "VERIFIED_DONATIONS" ? verified : total) >= item.thresholdValue)) {
      await prisma.donorAchievement.upsert({ where: { donorId_achievementId: { donorId: donor.id, achievementId: achievement.id } }, create: { id: id(`award:${donor.id}:${achievement.id}`), donorId: donor.id, achievementId: achievement.id, unlockedAt: at(-20) }, update: { unlockedAt: at(-20) } });
    }
  }

  const counts = {
    demoDonors: await prisma.donor.count({ where: { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` }, isDeleted: false } }),
    governanceSeats: await prisma.organizationMember.count({ where: { seatKey: { startsWith: "demo:" }, isDeleted: false } }),
    requests: await prisma.bloodRequest.count({ where: { referenceCode: { startsWith: "DEMO-" }, isDeleted: false } }),
    assignments: await prisma.requestAssignment.count({ where: { id: { in: assignmentSpecs.map((_, index) => id(`assignment:${index}`)) }, isDeleted: false } }),
    donations: await prisma.bloodDonation.count({ where: { id: { in: donationSpecs.map((item) => id(`donation:${item.key}`)) }, isDeleted: false } }),
    posts: await prisma.post.count({ where: { slug: { startsWith: "demo-post-" }, isDeleted: false } }),
    events: await prisma.event.count({ where: { slug: { startsWith: "demo-event-" }, isDeleted: false } }),
    blogs: await prisma.blog.count({ where: { slug: { startsWith: "demo-blog-" }, isDeleted: false } }),
    galleries: await prisma.gallery.count({ where: { slug: { startsWith: "demo-gallery-" }, isDeleted: false } }),
    institutions: await prisma.medicalInstitution.count({ where: { slug: { startsWith: "demo-medical-" }, isDeleted: false } }),
  };
  console.log("BD Blood demo seed complete:", counts);
  console.log(`Demo admin: ${admin.email}`);
  console.log(`Shared demo password: ${DEMO_PASSWORD}`);
}

seedDemo()
  .catch((error) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
