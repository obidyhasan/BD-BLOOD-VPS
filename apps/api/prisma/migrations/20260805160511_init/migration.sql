-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BloodRequestStatus" AS ENUM ('PENDING', 'SUBMITTED', 'PROCESSING', 'DONOR_FOUND', 'FULFILLED', 'COMPLETED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RequestAssignmentStatus" AS ENUM ('PENDING', 'NOTIFIED', 'ACCEPTED', 'REJECTED', 'DECLINED', 'EXPIRED', 'CANCELLED', 'DONATION_PENDING', 'DONATED');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('URGENT', 'EMERGENCY', 'EVENT', 'ANNOUNCEMENT', 'GENERAL', 'RECAP', 'DONATION', 'HELP_REQUEST', 'SOCIAL_ACTIVITY');

-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('DONATION_CAMP', 'WORKSHOP', 'AWARENESS', 'SOCIAL_ACTIVITY', 'BLOOD_CAMP');

-- CreateEnum
CREATE TYPE "ParticipationType" AS ENUM ('DONOR', 'VOLUNTEER');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('DONOR', 'ORGANIZATION', 'POST', 'EVENT');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'BLOOD_REQUEST', 'BLOOD', 'EVENT', 'ORG', 'POST', 'ADMIN');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW', 'ROUTINE');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DONOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "OrganizationMemberStatus" AS ENUM ('ACTIVE', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PositionLevel" AS ENUM ('EXECUTIVE', 'MANAGEMENT', 'SUPPORT');

-- CreateEnum
CREATE TYPE "PositionStatus" AS ENUM ('MAIN_ROLE', 'ASSISTANT', 'ACTIVE', 'GENERAL');

-- CreateEnum
CREATE TYPE "BloodRequestType" AS ENUM ('URGENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "PolicyCategory" AS ENUM ('SAFETY', 'ADMIN', 'DONOR', 'PRIVACY');

-- CreateEnum
CREATE TYPE "ContactMessageStatus" AS ENUM ('NEW', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AchievementThresholdType" AS ENUM ('VERIFIED_DONATIONS', 'TOTAL_DONATIONS');

-- CreateEnum
CREATE TYPE "OrganizationLevel" AS ENUM ('CENTRAL', 'DIVISION', 'DISTRICT', 'UPAZILA');

-- CreateEnum
CREATE TYPE "AffiliationSource" AS ENUM ('PROFILE', 'ADMIN', 'MIGRATION');

-- CreateEnum
CREATE TYPE "GovernanceCategory" AS ENUM ('COMMITTEE', 'ADVISOR');

-- CreateEnum
CREATE TYPE "DonorProfileStatus" AS ENUM ('INCOMPLETE', 'COMPLETE');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('SMS', 'IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "MessageOutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'DEAD');

-- CreateTable
CREATE TABLE "divisions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upazilas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "upazilas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloodGroups" (
    "id" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "bloodGroups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donors" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "bloodGroupId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'DONOR',
    "divisionId" TEXT,
    "districtId" TEXT,
    "upazilaId" TEXT,
    "lastDonationDate" TIMESTAMP(3),
    "nextEligibleDonationDate" TIMESTAMP(3),
    "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "profilePhoto" TEXT,
    "bio" TEXT,
    "referenceId" TEXT,
    "slug" TEXT,
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "profileStatus" "DonorProfileStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "profileCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "phoneVerifiedAt" TIMESTAMP(3),
    "notifyInApp" BOOLEAN NOT NULL DEFAULT true,
    "notifySms" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "donors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloodDonations" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "recipientName" TEXT,
    "hospitalName" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "upazilaId" TEXT NOT NULL,
    "organizationId" TEXT,
    "requestAssignmentId" TEXT,
    "donationDate" TIMESTAMP(3) NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "bloodDonations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "upazilaId" TEXT NOT NULL,
    "level" "OrganizationLevel" NOT NULL DEFAULT 'UPAZILA',
    "parentId" TEXT,
    "canonical" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "logo" TEXT,
    "type" TEXT,
    "organizationStatus" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "verificationStatus" "VerificationStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizationPositions" (
    "id" TEXT NOT NULL,
    "positionName" TEXT NOT NULL,
    "positionOrder" INTEGER NOT NULL,
    "level" "PositionLevel" NOT NULL DEFAULT 'SUPPORT',
    "positionStatus" "PositionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "organizationPositions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMembers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "donorId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "category" "GovernanceCategory" NOT NULL DEFAULT 'COMMITTEE',
    "seatKey" TEXT,
    "appointedById" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "OrganizationMemberStatus" NOT NULL DEFAULT 'PENDING',
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OrganizationMembers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizationBloodInventories" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "bloodGroupId" TEXT NOT NULL,
    "availableUnits" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "organizationBloodInventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodRequests" (
    "id" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterPhone" TEXT NOT NULL,
    "bloodGroupId" TEXT NOT NULL,
    "hospitalName" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "upazilaId" TEXT NOT NULL,
    "organizationId" TEXT,
    "handledByOrganizationId" TEXT,
    "acceptedById" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "donorFoundAt" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "handoverCompletedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "cancellationReason" TEXT,
    "rejectionReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "requiredUnits" INTEGER NOT NULL,
    "requestType" "BloodRequestType" NOT NULL DEFAULT 'GENERAL',
    "message" TEXT,
    "status" "BloodRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BloodRequests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_request_idempotency" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_request_idempotency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloodRequestNotifications" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "smsSent" BOOLEAN NOT NULL,
    "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "bloodRequestNotifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloodRequestDonorAlerts" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "smsSent" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bloodRequestDonorAlerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requestAssignments" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "status" "RequestAssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "assignedById" TEXT NOT NULL,
    "bagUnits" INTEGER NOT NULL DEFAULT 1,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "donationSubmittedAt" TIMESTAMP(3),
    "donatedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "declineReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "requestAssignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloodRequestStatusHistory" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "previousStatus" "BloodRequestStatus",
    "newStatus" "BloodRequestStatus" NOT NULL,
    "changedById" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloodRequestStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donationAppointments" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT,
    "bloodGroupId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "donationAppointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "organizationId" TEXT,
    "donationId" TEXT,
    "postType" "PostType" NOT NULL,
    "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC',
    "isWork" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT[],
    "approvalStatus" "ApprovalStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postComments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "postComments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postLikes" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postLikes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" "EventType" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "eventTime" TEXT,
    "slots" TEXT,
    "divisionId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "upazilaId" TEXT NOT NULL,
    "locationDetails" TEXT,
    "slug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventParticipants" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "participationType" "ParticipationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "eventParticipants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicalInstitutions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "logo" TEXT,
    "coverImage" TEXT,
    "divisionId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "upazilaId" TEXT NOT NULL,
    "openStatus" TEXT,
    "slug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "medicalInstitutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "visitingHours" TEXT,
    "experience" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicalInformations" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "createdBy" TEXT NOT NULL,
    "status" "ArticleStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "medicalInformations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicalAdvertisements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "redirectUrl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "AdStatus" NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "medicalAdvertisements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'ROUTINE',
    "relatedId" TEXT,
    "relatedType" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blogs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "authorId" TEXT NOT NULL,
    "status" "BlogStatus" NOT NULL,
    "reads" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "galleries" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "slug" TEXT NOT NULL,
    "coverImage" TEXT,
    "images" TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "galleries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policies" (
    "id" TEXT NOT NULL,
    "category" "PolicyCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactMessageStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "thresholdType" "AchievementThresholdType" NOT NULL,
    "thresholdValue" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donor_achievements" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donor_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donor_organization_affiliations" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "upazilaId" TEXT NOT NULL,
    "source" "AffiliationSource" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donor_organization_affiliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_outbox" (
    "id" TEXT NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "templateKey" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "status" "MessageOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "providerMessageId" TEXT,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "districts_divisionId_idx" ON "districts"("divisionId");

-- CreateIndex
CREATE INDEX "upazilas_districtId_idx" ON "upazilas"("districtId");

-- CreateIndex
CREATE UNIQUE INDEX "bloodGroups_groupName_key" ON "bloodGroups"("groupName");

-- CreateIndex
CREATE UNIQUE INDEX "donors_phone_key" ON "donors"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "donors_email_key" ON "donors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "donors_slug_key" ON "donors"("slug");

-- CreateIndex
CREATE INDEX "donors_bloodGroupId_idx" ON "donors"("bloodGroupId");

-- CreateIndex
CREATE INDEX "donors_districtId_idx" ON "donors"("districtId");

-- CreateIndex
CREATE INDEX "donors_upazilaId_idx" ON "donors"("upazilaId");

-- CreateIndex
CREATE INDEX "donors_availabilityStatus_idx" ON "donors"("availabilityStatus");

-- CreateIndex
CREATE INDEX "donors_accountStatus_idx" ON "donors"("accountStatus");

-- CreateIndex
CREATE INDEX "donors_nextEligibleDonationDate_idx" ON "donors"("nextEligibleDonationDate");

-- CreateIndex
CREATE INDEX "donors_districtId_upazilaId_bloodGroupId_accountStatus_avai_idx" ON "donors"("districtId", "upazilaId", "bloodGroupId", "accountStatus", "availabilityStatus");

-- CreateIndex
CREATE UNIQUE INDEX "bloodDonations_requestAssignmentId_key" ON "bloodDonations"("requestAssignmentId");

-- CreateIndex
CREATE INDEX "bloodDonations_donorId_idx" ON "bloodDonations"("donorId");

-- CreateIndex
CREATE INDEX "bloodDonations_verificationStatus_idx" ON "bloodDonations"("verificationStatus");

-- CreateIndex
CREATE INDEX "bloodDonations_divisionId_idx" ON "bloodDonations"("divisionId");

-- CreateIndex
CREATE INDEX "bloodDonations_districtId_idx" ON "bloodDonations"("districtId");

-- CreateIndex
CREATE INDEX "bloodDonations_organizationId_idx" ON "bloodDonations"("organizationId");

-- CreateIndex
CREATE INDEX "bloodDonations_requestAssignmentId_idx" ON "bloodDonations"("requestAssignmentId");

-- CreateIndex
CREATE INDEX "bloodDonations_createdAt_idx" ON "bloodDonations"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_email_key" ON "organizations"("email");

-- CreateIndex
CREATE INDEX "organizations_districtId_idx" ON "organizations"("districtId");

-- CreateIndex
CREATE INDEX "organizations_level_idx" ON "organizations"("level");

-- CreateIndex
CREATE INDEX "organizations_parentId_idx" ON "organizations"("parentId");

-- CreateIndex
CREATE INDEX "organizations_canonical_idx" ON "organizations"("canonical");

-- CreateIndex
CREATE INDEX "organizations_verificationStatus_idx" ON "organizations"("verificationStatus");

-- CreateIndex
CREATE INDEX "organizations_organizationStatus_idx" ON "organizations"("organizationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembers_donorId_key" ON "OrganizationMembers"("donorId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembers_seatKey_key" ON "OrganizationMembers"("seatKey");

-- CreateIndex
CREATE INDEX "OrganizationMembers_organizationId_idx" ON "OrganizationMembers"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationMembers_category_idx" ON "OrganizationMembers"("category");

-- CreateIndex
CREATE INDEX "OrganizationMembers_appointedById_idx" ON "OrganizationMembers"("appointedById");

-- CreateIndex
CREATE INDEX "OrganizationMembers_positionId_idx" ON "OrganizationMembers"("positionId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembers_organizationId_donorId_key" ON "OrganizationMembers"("organizationId", "donorId");

-- CreateIndex
CREATE INDEX "organizationBloodInventories_organizationId_idx" ON "organizationBloodInventories"("organizationId");

-- CreateIndex
CREATE INDEX "organizationBloodInventories_bloodGroupId_idx" ON "organizationBloodInventories"("bloodGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "organizationBloodInventories_organizationId_bloodGroupId_key" ON "organizationBloodInventories"("organizationId", "bloodGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "BloodRequests_referenceCode_key" ON "BloodRequests"("referenceCode");

-- CreateIndex
CREATE INDEX "BloodRequests_bloodGroupId_idx" ON "BloodRequests"("bloodGroupId");

-- CreateIndex
CREATE INDEX "BloodRequests_districtId_idx" ON "BloodRequests"("districtId");

-- CreateIndex
CREATE INDEX "BloodRequests_organizationId_idx" ON "BloodRequests"("organizationId");

-- CreateIndex
CREATE INDEX "BloodRequests_handledByOrganizationId_idx" ON "BloodRequests"("handledByOrganizationId");

-- CreateIndex
CREATE INDEX "BloodRequests_status_idx" ON "BloodRequests"("status");

-- CreateIndex
CREATE INDEX "BloodRequests_requestType_idx" ON "BloodRequests"("requestType");

-- CreateIndex
CREATE INDEX "BloodRequests_createdAt_idx" ON "BloodRequests"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "public_request_idempotency_key_key" ON "public_request_idempotency"("key");

-- CreateIndex
CREATE UNIQUE INDEX "public_request_idempotency_requestId_key" ON "public_request_idempotency"("requestId");

-- CreateIndex
CREATE INDEX "public_request_idempotency_expiresAt_idx" ON "public_request_idempotency"("expiresAt");

-- CreateIndex
CREATE INDEX "bloodRequestNotifications_requestId_idx" ON "bloodRequestNotifications"("requestId");

-- CreateIndex
CREATE INDEX "bloodRequestNotifications_organizationId_idx" ON "bloodRequestNotifications"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "bloodRequestNotifications_requestId_organizationId_key" ON "bloodRequestNotifications"("requestId", "organizationId");

-- CreateIndex
CREATE INDEX "bloodRequestDonorAlerts_requestId_idx" ON "bloodRequestDonorAlerts"("requestId");

-- CreateIndex
CREATE INDEX "bloodRequestDonorAlerts_donorId_idx" ON "bloodRequestDonorAlerts"("donorId");

-- CreateIndex
CREATE UNIQUE INDEX "bloodRequestDonorAlerts_requestId_donorId_key" ON "bloodRequestDonorAlerts"("requestId", "donorId");

-- CreateIndex
CREATE INDEX "requestAssignments_requestId_idx" ON "requestAssignments"("requestId");

-- CreateIndex
CREATE INDEX "requestAssignments_requestId_status_idx" ON "requestAssignments"("requestId", "status");

-- CreateIndex
CREATE INDEX "requestAssignments_donorId_idx" ON "requestAssignments"("donorId");

-- CreateIndex
CREATE INDEX "requestAssignments_status_idx" ON "requestAssignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "requestAssignments_requestId_donorId_key" ON "requestAssignments"("requestId", "donorId");

-- CreateIndex
CREATE INDEX "bloodRequestStatusHistory_requestId_idx" ON "bloodRequestStatusHistory"("requestId");

-- CreateIndex
CREATE INDEX "bloodRequestStatusHistory_changedById_idx" ON "bloodRequestStatusHistory"("changedById");

-- CreateIndex
CREATE INDEX "donationAppointments_donorId_idx" ON "donationAppointments"("donorId");

-- CreateIndex
CREATE INDEX "donationAppointments_organizationId_idx" ON "donationAppointments"("organizationId");

-- CreateIndex
CREATE INDEX "donationAppointments_eventId_idx" ON "donationAppointments"("eventId");

-- CreateIndex
CREATE INDEX "donationAppointments_scheduledAt_idx" ON "donationAppointments"("scheduledAt");

-- CreateIndex
CREATE INDEX "donationAppointments_status_idx" ON "donationAppointments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "posts_donationId_key" ON "posts"("donationId");

-- CreateIndex
CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");

-- CreateIndex
CREATE INDEX "posts_donorId_idx" ON "posts"("donorId");

-- CreateIndex
CREATE INDEX "posts_organizationId_idx" ON "posts"("organizationId");

-- CreateIndex
CREATE INDEX "posts_approvalStatus_idx" ON "posts"("approvalStatus");

-- CreateIndex
CREATE INDEX "posts_postType_idx" ON "posts"("postType");

-- CreateIndex
CREATE INDEX "posts_isWork_idx" ON "posts"("isWork");

-- CreateIndex
CREATE INDEX "posts_organizationId_createdAt_idx" ON "posts"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "posts_approvalStatus_createdAt_idx" ON "posts"("approvalStatus", "createdAt");

-- CreateIndex
CREATE INDEX "postComments_postId_idx" ON "postComments"("postId");

-- CreateIndex
CREATE INDEX "postComments_donorId_idx" ON "postComments"("donorId");

-- CreateIndex
CREATE INDEX "postComments_parentId_idx" ON "postComments"("parentId");

-- CreateIndex
CREATE INDEX "postLikes_postId_idx" ON "postLikes"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "postLikes_postId_donorId_key" ON "postLikes"("postId", "donorId");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_organizationId_idx" ON "events"("organizationId");

-- CreateIndex
CREATE INDEX "events_eventType_idx" ON "events"("eventType");

-- CreateIndex
CREATE INDEX "events_eventDate_idx" ON "events"("eventDate");

-- CreateIndex
CREATE INDEX "events_districtId_idx" ON "events"("districtId");

-- CreateIndex
CREATE INDEX "eventParticipants_eventId_idx" ON "eventParticipants"("eventId");

-- CreateIndex
CREATE INDEX "eventParticipants_donorId_idx" ON "eventParticipants"("donorId");

-- CreateIndex
CREATE UNIQUE INDEX "eventParticipants_eventId_donorId_key" ON "eventParticipants"("eventId", "donorId");

-- CreateIndex
CREATE UNIQUE INDEX "medicalInstitutions_slug_key" ON "medicalInstitutions"("slug");

-- CreateIndex
CREATE INDEX "medicalInstitutions_divisionId_idx" ON "medicalInstitutions"("divisionId");

-- CreateIndex
CREATE INDEX "medicalInstitutions_districtId_idx" ON "medicalInstitutions"("districtId");

-- CreateIndex
CREATE INDEX "medicalInstitutions_upazilaId_idx" ON "medicalInstitutions"("upazilaId");

-- CreateIndex
CREATE INDEX "doctors_institutionId_idx" ON "doctors"("institutionId");

-- CreateIndex
CREATE INDEX "medicalInformations_createdBy_idx" ON "medicalInformations"("createdBy");

-- CreateIndex
CREATE INDEX "medicalInformations_status_idx" ON "medicalInformations"("status");

-- CreateIndex
CREATE INDEX "medicalAdvertisements_createdBy_idx" ON "medicalAdvertisements"("createdBy");

-- CreateIndex
CREATE INDEX "medicalAdvertisements_status_idx" ON "medicalAdvertisements"("status");

-- CreateIndex
CREATE INDEX "notifications_donorId_idx" ON "notifications"("donorId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_donorId_createdAt_idx" ON "notifications"("donorId", "createdAt");

-- CreateIndex
CREATE INDEX "reports_reportedBy_idx" ON "reports"("reportedBy");

-- CreateIndex
CREATE INDEX "reports_targetType_idx" ON "reports"("targetType");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "blogs_slug_key" ON "blogs"("slug");

-- CreateIndex
CREATE INDEX "blogs_authorId_idx" ON "blogs"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "galleries_slug_key" ON "galleries"("slug");

-- CreateIndex
CREATE INDEX "galleries_organizationId_idx" ON "galleries"("organizationId");

-- CreateIndex
CREATE INDEX "galleries_organizationId_isPublished_sortOrder_idx" ON "galleries"("organizationId", "isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "galleries_isFeatured_isPublished_idx" ON "galleries"("isFeatured", "isPublished");

-- CreateIndex
CREATE INDEX "faqs_active_idx" ON "faqs"("active");

-- CreateIndex
CREATE INDEX "faqs_category_idx" ON "faqs"("category");

-- CreateIndex
CREATE INDEX "faqs_order_idx" ON "faqs"("order");

-- CreateIndex
CREATE INDEX "policies_category_idx" ON "policies"("category");

-- CreateIndex
CREATE INDEX "policies_active_idx" ON "policies"("active");

-- CreateIndex
CREATE INDEX "contact_messages_status_idx" ON "contact_messages"("status");

-- CreateIndex
CREATE INDEX "contact_messages_createdAt_idx" ON "contact_messages"("createdAt");

-- CreateIndex
CREATE INDEX "achievements_active_idx" ON "achievements"("active");

-- CreateIndex
CREATE INDEX "achievements_thresholdType_idx" ON "achievements"("thresholdType");

-- CreateIndex
CREATE INDEX "donor_achievements_donorId_idx" ON "donor_achievements"("donorId");

-- CreateIndex
CREATE INDEX "donor_achievements_achievementId_idx" ON "donor_achievements"("achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "donor_achievements_donorId_achievementId_key" ON "donor_achievements"("donorId", "achievementId");

-- CreateIndex
CREATE INDEX "donor_organization_affiliations_organizationId_active_idx" ON "donor_organization_affiliations"("organizationId", "active");

-- CreateIndex
CREATE INDEX "donor_organization_affiliations_upazilaId_active_idx" ON "donor_organization_affiliations"("upazilaId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "donor_organization_affiliations_donorId_key" ON "donor_organization_affiliations"("donorId");

-- CreateIndex
CREATE UNIQUE INDEX "message_outbox_eventKey_key" ON "message_outbox"("eventKey");

-- CreateIndex
CREATE INDEX "message_outbox_status_nextAttemptAt_idx" ON "message_outbox"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "message_outbox_aggregateType_aggregateId_idx" ON "message_outbox"("aggregateType", "aggregateId");

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upazilas" ADD CONSTRAINT "upazilas_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donors" ADD CONSTRAINT "donors_bloodGroupId_fkey" FOREIGN KEY ("bloodGroupId") REFERENCES "bloodGroups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donors" ADD CONSTRAINT "donors_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donors" ADD CONSTRAINT "donors_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donors" ADD CONSTRAINT "donors_upazilaId_fkey" FOREIGN KEY ("upazilaId") REFERENCES "upazilas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donors" ADD CONSTRAINT "donors_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloodDonations" ADD CONSTRAINT "bloodDonations_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloodDonations" ADD CONSTRAINT "bloodDonations_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloodDonations" ADD CONSTRAINT "bloodDonations_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloodDonations" ADD CONSTRAINT "bloodDonations_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloodDonations" ADD CONSTRAINT "bloodDonations_upazilaId_fkey" FOREIGN KEY ("upazilaId") REFERENCES "upazilas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloodDonations" ADD CONSTRAINT "bloodDonations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloodDonations" ADD CONSTRAINT "bloodDonations_requestAssignmentId_fkey" FOREIGN KEY ("requestAssignmentId") REFERENCES "requestAssignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembers" ADD CONSTRAINT "OrganizationMembers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembers" ADD CONSTRAINT "OrganizationMembers_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembers" ADD CONSTRAINT "OrganizationMembers_appointedById_fkey" FOREIGN KEY ("appointedById") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembers" ADD CONSTRAINT "OrganizationMembers_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "organizationPositions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizationBloodInventories" ADD CONSTRAINT "organizationBloodInventories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizationBloodInventories" ADD CONSTRAINT "organizationBloodInventories_bloodGroupId_fkey" FOREIGN KEY ("bloodGroupId") REFERENCES "bloodGroups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequests" ADD CONSTRAINT "BloodRequests_bloodGroupId_fkey" FOREIGN KEY ("bloodGroupId") REFERENCES "bloodGroups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequests" ADD CONSTRAINT "BloodRequests_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequests" ADD CONSTRAINT "BloodRequests_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequests" ADD CONSTRAINT "BloodRequests_upazilaId_fkey" FOREIGN KEY ("upazilaId") REFERENCES "upazilas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequests" ADD CONSTRAINT "BloodRequests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequests" ADD CONSTRAINT "BloodRequests_handledByOrganizationId_fkey" FOREIGN KEY ("handledByOrganizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequests" ADD CONSTRAINT "BloodRequests_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequests" ADD CONSTRAINT "BloodRequests_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequests" ADD CONSTRAINT "BloodRequests_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequests" ADD CONSTRAINT "BloodRequests_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_request_idempotency" ADD CONSTRAINT "public_request_idempotency_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloodRequestNotifications" ADD CONSTRAINT "bloodRequestNotifications_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloodRequestNotifications" ADD CONSTRAINT "bloodRequestNotifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloodRequestDonorAlerts" ADD CONSTRAINT "bloodRequestDonorAlerts_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloodRequestDonorAlerts" ADD CONSTRAINT "bloodRequestDonorAlerts_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requestAssignments" ADD CONSTRAINT "requestAssignments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requestAssignments" ADD CONSTRAINT "requestAssignments_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requestAssignments" ADD CONSTRAINT "requestAssignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "donors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloodRequestStatusHistory" ADD CONSTRAINT "bloodRequestStatusHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloodRequestStatusHistory" ADD CONSTRAINT "bloodRequestStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donationAppointments" ADD CONSTRAINT "donationAppointments_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donationAppointments" ADD CONSTRAINT "donationAppointments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donationAppointments" ADD CONSTRAINT "donationAppointments_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donationAppointments" ADD CONSTRAINT "donationAppointments_bloodGroupId_fkey" FOREIGN KEY ("bloodGroupId") REFERENCES "bloodGroups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "bloodDonations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postComments" ADD CONSTRAINT "postComments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postComments" ADD CONSTRAINT "postComments_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postComments" ADD CONSTRAINT "postComments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "postComments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postLikes" ADD CONSTRAINT "postLikes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postLikes" ADD CONSTRAINT "postLikes_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_upazilaId_fkey" FOREIGN KEY ("upazilaId") REFERENCES "upazilas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventParticipants" ADD CONSTRAINT "eventParticipants_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventParticipants" ADD CONSTRAINT "eventParticipants_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "medicalInstitutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicalInformations" ADD CONSTRAINT "medicalInformations_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "medicalInstitutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicalAdvertisements" ADD CONSTRAINT "medicalAdvertisements_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "medicalInstitutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reportedBy_fkey" FOREIGN KEY ("reportedBy") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galleries" ADD CONSTRAINT "galleries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donor_achievements" ADD CONSTRAINT "donor_achievements_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donor_achievements" ADD CONSTRAINT "donor_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donor_organization_affiliations" ADD CONSTRAINT "donor_organization_affiliations_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donor_organization_affiliations" ADD CONSTRAINT "donor_organization_affiliations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donor_organization_affiliations" ADD CONSTRAINT "donor_organization_affiliations_upazilaId_fkey" FOREIGN KEY ("upazilaId") REFERENCES "upazilas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
