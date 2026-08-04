-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BloodRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'FULFILLED', 'CANCELLED', 'REJECTED');

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
    "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "profilePhoto" TEXT,
    "bio" TEXT,
    "referenceId" TEXT,
    "slug" TEXT,
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
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
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "requesterName" TEXT NOT NULL,
    "requesterPhone" TEXT NOT NULL,
    "bloodGroupId" TEXT NOT NULL,
    "hospitalName" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "upazilaId" TEXT NOT NULL,
    "requiredUnits" INTEGER NOT NULL,
    "requestType" "BloodRequestType" NOT NULL DEFAULT 'GENERAL',
    "message" TEXT,
    "status" "BloodRequestStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BloodRequests_pkey" PRIMARY KEY ("id")
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
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "galleries_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "bloodDonations_donorId_idx" ON "bloodDonations"("donorId");

-- CreateIndex
CREATE INDEX "bloodDonations_verificationStatus_idx" ON "bloodDonations"("verificationStatus");

-- CreateIndex
CREATE INDEX "bloodDonations_divisionId_idx" ON "bloodDonations"("divisionId");

-- CreateIndex
CREATE INDEX "bloodDonations_districtId_idx" ON "bloodDonations"("districtId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_email_key" ON "organizations"("email");

-- CreateIndex
CREATE INDEX "organizations_districtId_idx" ON "organizations"("districtId");

-- CreateIndex
CREATE INDEX "organizations_verificationStatus_idx" ON "organizations"("verificationStatus");

-- CreateIndex
CREATE INDEX "organizations_organizationStatus_idx" ON "organizations"("organizationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMembers_donorId_key" ON "OrganizationMembers"("donorId");

-- CreateIndex
CREATE INDEX "OrganizationMembers_organizationId_idx" ON "OrganizationMembers"("organizationId");

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
CREATE INDEX "BloodRequests_bloodGroupId_idx" ON "BloodRequests"("bloodGroupId");

-- CreateIndex
CREATE INDEX "BloodRequests_districtId_idx" ON "BloodRequests"("districtId");

-- CreateIndex
CREATE INDEX "BloodRequests_status_idx" ON "BloodRequests"("status");

-- CreateIndex
CREATE INDEX "BloodRequests_requestType_idx" ON "BloodRequests"("requestType");

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
CREATE INDEX "postComments_postId_idx" ON "postComments"("postId");

-- CreateIndex
CREATE INDEX "postComments_donorId_idx" ON "postComments"("donorId");

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
CREATE INDEX "medicalInstitutions_districtId_idx" ON "medicalInstitutions"("districtId");

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
CREATE INDEX "policies_category_idx" ON "policies"("category");

-- CreateIndex
CREATE INDEX "policies_active_idx" ON "policies"("active");

-- CreateIndex
CREATE INDEX "contact_messages_status_idx" ON "contact_messages"("status");

-- CreateIndex
CREATE INDEX "contact_messages_createdAt_idx" ON "contact_messages"("createdAt");

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
ALTER TABLE "OrganizationMembers" ADD CONSTRAINT "OrganizationMembers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMembers" ADD CONSTRAINT "OrganizationMembers_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "bloodRequestNotifications" ADD CONSTRAINT "bloodRequestNotifications_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloodRequestNotifications" ADD CONSTRAINT "bloodRequestNotifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloodRequestDonorAlerts" ADD CONSTRAINT "bloodRequestDonorAlerts_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloodRequestDonorAlerts" ADD CONSTRAINT "bloodRequestDonorAlerts_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "posts" ADD CONSTRAINT "posts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postComments" ADD CONSTRAINT "postComments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postComments" ADD CONSTRAINT "postComments_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
