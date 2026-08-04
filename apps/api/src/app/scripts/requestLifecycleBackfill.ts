import {
  BloodRequestStatus,
  RequestAssignmentStatus,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "../shared/prisma";
import {
  assignmentCountsAsCommitted,
  findUnambiguousDonationAssignment,
  normalizeAssignmentStatus,
  normalizeRequestStatus,
} from "../shared/requestLifecycleBackfillRules";

const apply = process.argv.includes("--apply");
const HISTORY_REASON = "PHASE_4_LIFECYCLE_BACKFILL";

type ReviewItem = {
  code: string;
  severity: "BLOCKER" | "REVIEW";
  requestId?: string;
  donationId?: string;
  assignmentIds?: string[];
  detail: string;
};

const main = async () => {
  const [requests, unlinkedDonations, canonicalUpazilaOrganizations] =
    await Promise.all([
      prisma.bloodRequest.findMany({
        where: { isDeleted: false },
        include: {
          notifications: {
            where: { isDeleted: false },
            orderBy: [{ notifiedAt: "asc" }, { createdAt: "asc" }],
            select: { organizationId: true, notifiedAt: true },
          },
          donorAlerts: { select: { notifiedAt: true } },
          assignments: {
            where: { isDeleted: false },
            include: {
              donation: {
                select: {
                  id: true,
                  verificationStatus: true,
                  verifiedAt: true,
                  donationDate: true,
                },
              },
            },
          },
          statusHistory: {
            where: { reason: HISTORY_REASON },
            select: { id: true, newStatus: true },
          },
        },
      }),
      prisma.bloodDonation.findMany({
        where: { isDeleted: false, requestAssignmentId: null },
        select: {
          id: true,
          donorId: true,
          hospitalName: true,
          divisionId: true,
          districtId: true,
          upazilaId: true,
          donationDate: true,
          verificationStatus: true,
          verifiedAt: true,
        },
      }),
      prisma.organization.findMany({
        where: {
          isDeleted: false,
          canonical: true,
          level: "UPAZILA",
        },
        select: { id: true, upazilaId: true },
      }),
    ]);

  const review: ReviewItem[] = [];
  const canonicalByUpazila = new Map<string, string>();
  for (const organization of canonicalUpazilaOrganizations) {
    if (canonicalByUpazila.has(organization.upazilaId)) {
      review.push({
        code: "CANONICAL_UPAZILA_COLLISION",
        severity: "BLOCKER",
        detail: `More than one canonical organization exists for Upazila ${organization.upazilaId}.`,
      });
    } else {
      canonicalByUpazila.set(organization.upazilaId, organization.id);
    }
  }

  const candidateAssignments = requests.flatMap((request) =>
    request.assignments
      .filter(
        (assignment) =>
          !assignment.donation && assignmentCountsAsCommitted(assignment.status),
      )
      .map((assignment) => ({
        assignmentId: assignment.id,
        donorId: assignment.donorId,
        assignedAt: assignment.assignedAt,
        request: {
          hospitalName: request.hospitalName,
          divisionId: request.divisionId,
          districtId: request.districtId,
          upazilaId: request.upazilaId,
        },
      })),
  );

  const provisionalLinks = new Map<string, string>();
  const donationsByAssignment = new Map<string, string[]>();
  for (const donation of unlinkedDonations) {
    const candidate = findUnambiguousDonationAssignment(
      donation,
      candidateAssignments,
    );
    if (!candidate) {
      review.push({
        code: "DONATION_LINK_UNRESOLVED",
        severity: "REVIEW",
        donationId: donation.id,
        detail:
          "No unique committed assignment matches donor, geography, hospital, and date window.",
      });
      continue;
    }
    provisionalLinks.set(donation.id, candidate.assignmentId);
    const donationIds = donationsByAssignment.get(candidate.assignmentId) ?? [];
    donationIds.push(donation.id);
    donationsByAssignment.set(candidate.assignmentId, donationIds);
  }

  for (const [assignmentId, donationIds] of donationsByAssignment) {
    if (donationIds.length <= 1) continue;
    for (const donationId of donationIds) provisionalLinks.delete(donationId);
    review.push({
      code: "ASSIGNMENT_LINK_COLLISION",
      severity: "BLOCKER",
      donationId: donationIds.join(","),
      assignmentIds: [assignmentId],
      detail:
        "Multiple donations resolve to one one-bag assignment; manual selection is required.",
    });
  }

  const unlinkedDonationById = new Map(
    unlinkedDonations.map((donation) => [donation.id, donation]),
  );
  const plannedDonationByAssignment = new Map<string, string>();
  for (const [donationId, assignmentId] of provisionalLinks) {
    plannedDonationByAssignment.set(assignmentId, donationId);
  }

  const requestPlans = requests.map((request) => {
    const handledByOrganizationId =
      request.handledByOrganizationId ??
      request.organizationId ??
      request.notifications[0]?.organizationId ??
      canonicalByUpazila.get(request.upazilaId) ??
      null;

    if (!handledByOrganizationId) {
      review.push({
        code: "HANDLING_ORGANIZATION_UNRESOLVED",
        severity: "BLOCKER",
        requestId: request.id,
        detail:
          "No existing organization, earliest notification, or canonical Upazila organization can handle this request.",
      });
    }

    const assignments = request.assignments.map((assignment) => {
      const normalizedStatus = normalizeAssignmentStatus(assignment.status);
      const plannedDonationId = plannedDonationByAssignment.get(assignment.id);
      const plannedDonation = plannedDonationId
        ? unlinkedDonationById.get(plannedDonationId)
        : null;
      const donation = assignment.donation ?? plannedDonation ?? null;
      const finalStatus =
        donation?.verificationStatus === VerificationStatus.VERIFIED
          ? RequestAssignmentStatus.DONATED
          : normalizedStatus;

      return {
        id: assignment.id,
        previousStatus: assignment.status,
        status: finalStatus,
        notifiedAt:
          assignment.notifiedAt ??
          (normalizedStatus === RequestAssignmentStatus.NOTIFIED
            ? assignment.assignedAt
            : null),
        declinedAt:
          assignment.declinedAt ??
          (assignment.status === RequestAssignmentStatus.REJECTED
            ? (assignment.rejectedAt ?? assignment.updatedAt)
            : null),
        donatedAt:
          assignment.donatedAt ??
          (donation?.verificationStatus === VerificationStatus.VERIFIED
            ? (donation.verifiedAt ?? donation.donationDate)
            : null),
        donation,
      };
    });

    const committedUnits = assignments
      .filter((assignment) => assignmentCountsAsCommitted(assignment.status))
      .reduce((sum, assignment) => {
        const source = request.assignments.find((item) => item.id === assignment.id);
        return sum + (source?.bagUnits ?? 1);
      }, 0);
    const verifiedLinkedUnits = assignments
      .filter(
        (assignment) =>
          assignment.donation?.verificationStatus === VerificationStatus.VERIFIED,
      )
      .reduce((sum, assignment) => {
        const source = request.assignments.find((item) => item.id === assignment.id);
        return sum + (source?.bagUnits ?? 1);
      }, 0);
    const hasDispatchEvidence = Boolean(
      request.assignments.length ||
        request.donorAlerts.length ||
        request.notifications.length,
    );
    const status = normalizeRequestStatus({
      currentStatus: request.status,
      requiredUnits: request.requiredUnits,
      committedUnits,
      verifiedLinkedUnits,
      hasDispatchEvidence,
    });
    const acceptedEvidence = [
      ...request.assignments.map((assignment) => assignment.assignedAt),
      ...request.donorAlerts.map((alert) => alert.notifiedAt),
    ].sort((left, right) => left.getTime() - right.getTime())[0];
    const donorFoundEvidence = assignments
      .filter((assignment) => assignmentCountsAsCommitted(assignment.status))
      .map((assignment) =>
        request.assignments.find((item) => item.id === assignment.id)?.acceptedAt,
      )
      .filter((value): value is Date => Boolean(value))
      .sort((left, right) => right.getTime() - left.getTime())[0];
    const fulfilledEvidence = assignments
      .map((assignment) =>
        assignment.donation?.verificationStatus === VerificationStatus.VERIFIED
          ? (assignment.donation.verifiedAt ?? assignment.donation.donationDate)
          : null,
      )
      .filter((value): value is Date => Boolean(value))
      .sort((left, right) => right.getTime() - left.getTime())[0];

    return {
      id: request.id,
      previousStatus: request.status,
      status,
      handledByOrganizationId,
      acceptedAt:
        request.acceptedAt ??
        (status !== BloodRequestStatus.SUBMITTED ? (acceptedEvidence ?? null) : null),
      donorFoundAt:
        request.donorFoundAt ??
        (status === BloodRequestStatus.DONOR_FOUND ||
        status === BloodRequestStatus.FULFILLED ||
        status === BloodRequestStatus.COMPLETED
          ? (donorFoundEvidence ?? request.confirmedAt ?? null)
          : null),
      fulfilledAt:
        request.fulfilledAt ??
        (status === BloodRequestStatus.FULFILLED ||
        status === BloodRequestStatus.COMPLETED
          ? (fulfilledEvidence ?? request.confirmedAt ?? null)
          : null),
      assignments,
      historyExists: request.statusHistory.some(
        (history) => history.newStatus === status,
      ),
      committedUnits,
      verifiedLinkedUnits,
    };
  });

  const blockers = review.filter((item) => item.severity === "BLOCKER");
  if (apply && blockers.length) {
    console.error(
      `Apply refused: resolve ${blockers.length} blocker(s) reported by dry run first.`,
    );
    process.exitCode = 2;
  } else if (apply) {
    await prisma.$transaction(async (tx) => {
      for (const [donationId, assignmentId] of provisionalLinks) {
        await tx.bloodDonation.update({
          where: { id: donationId },
          data: { requestAssignmentId: assignmentId },
        });
      }

      for (const request of requestPlans) {
        for (const assignment of request.assignments) {
          await tx.requestAssignment.update({
            where: { id: assignment.id },
            data: {
              status: assignment.status,
              notifiedAt: assignment.notifiedAt,
              declinedAt: assignment.declinedAt,
              donatedAt: assignment.donatedAt,
            },
          });
        }

        await tx.bloodRequest.update({
          where: { id: request.id },
          data: {
            status: request.status,
            handledByOrganizationId: request.handledByOrganizationId,
            acceptedAt: request.acceptedAt,
            donorFoundAt: request.donorFoundAt,
            fulfilledAt: request.fulfilledAt,
          },
        });

        if (request.previousStatus !== request.status && !request.historyExists) {
          await tx.bloodRequestStatusHistory.create({
            data: {
              requestId: request.id,
              previousStatus: request.previousStatus,
              newStatus: request.status,
              reason: HISTORY_REASON,
            },
          });
        }
      }
    });
  }

  console.log(
    JSON.stringify(
      {
        mode: apply ? "APPLY" : "DRY_RUN",
        summary: {
          requestsScanned: requestPlans.length,
          requestStatusesChanging: requestPlans.filter(
            (request) => request.previousStatus !== request.status,
          ).length,
          assignmentStatusesChanging: requestPlans.flatMap(
            (request) => request.assignments,
          ).filter((assignment) => assignment.previousStatus !== assignment.status)
            .length,
          donationLinksPlanned: provisionalLinks.size,
          historicalMessagesCreated: 0,
          blockers: blockers.length,
          reviewItems: review.filter((item) => item.severity === "REVIEW").length,
        },
        requestPlans: requestPlans.map((request) => ({
          id: request.id,
          previousStatus: request.previousStatus,
          status: request.status,
          handledByOrganizationId: request.handledByOrganizationId,
          committedUnits: request.committedUnits,
          verifiedLinkedUnits: request.verifiedLinkedUnits,
        })),
        review,
      },
      null,
      2,
    ),
  );
  if (!apply) {
    console.error("Dry run only. Re-run with --apply after reviewing the report.");
    if (blockers.length) process.exitCode = 2;
  }
};

main()
  .catch((error) => {
    console.error("Phase 4 request lifecycle backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
