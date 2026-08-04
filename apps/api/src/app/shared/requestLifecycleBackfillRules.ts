import {
  BloodRequestStatus,
  RequestAssignmentStatus,
} from "@prisma/client";

export type RequestLifecycleFacts = {
  currentStatus: BloodRequestStatus;
  requiredUnits: number;
  committedUnits: number;
  verifiedLinkedUnits: number;
  hasDispatchEvidence: boolean;
};

export const normalizeAssignmentStatus = (
  status: RequestAssignmentStatus,
): RequestAssignmentStatus => {
  if (status === RequestAssignmentStatus.PENDING) {
    return RequestAssignmentStatus.NOTIFIED;
  }
  if (status === RequestAssignmentStatus.REJECTED) {
    return RequestAssignmentStatus.DECLINED;
  }
  return status;
};

export const normalizeRequestStatus = ({
  currentStatus,
  requiredUnits,
  committedUnits,
  verifiedLinkedUnits,
  hasDispatchEvidence,
}: RequestLifecycleFacts): BloodRequestStatus => {
  if (
    currentStatus === BloodRequestStatus.CANCELLED ||
    currentStatus === BloodRequestStatus.REJECTED ||
    currentStatus === BloodRequestStatus.COMPLETED
  ) {
    return currentStatus;
  }

  if (verifiedLinkedUnits >= requiredUnits) {
    return BloodRequestStatus.FULFILLED;
  }
  if (committedUnits >= requiredUnits) {
    return BloodRequestStatus.DONOR_FOUND;
  }
  if (
    currentStatus === BloodRequestStatus.PENDING ||
    currentStatus === BloodRequestStatus.SUBMITTED
  ) {
    return hasDispatchEvidence
      ? BloodRequestStatus.PROCESSING
      : BloodRequestStatus.SUBMITTED;
  }
  return BloodRequestStatus.PROCESSING;
};

export const assignmentCountsAsCommitted = (
  status: RequestAssignmentStatus,
) =>
  status === RequestAssignmentStatus.ACCEPTED ||
  status === RequestAssignmentStatus.DONATION_PENDING ||
  status === RequestAssignmentStatus.DONATED;

export type DonationLinkCandidate = {
  assignmentId: string;
  donorId: string;
  assignedAt: Date;
  request: {
    hospitalName: string;
    divisionId: string;
    districtId: string;
    upazilaId: string;
  };
};

export type UnlinkedDonationFacts = {
  donorId: string;
  hospitalName: string;
  divisionId: string;
  districtId: string;
  upazilaId: string;
  donationDate: Date;
};

const normalizeText = (value: string) => value.trim().toLocaleLowerCase();

export const findUnambiguousDonationAssignment = (
  donation: UnlinkedDonationFacts,
  candidates: DonationLinkCandidate[],
): DonationLinkCandidate | null => {
  const matches = candidates.filter((candidate) => {
    const request = candidate.request;
    const assignedBeforeDonation = candidate.assignedAt <= donation.donationDate;
    const withinPlausibleWindow =
      donation.donationDate.getTime() - candidate.assignedAt.getTime() <=
      30 * 24 * 60 * 60 * 1000;

    return (
      candidate.donorId === donation.donorId &&
      request.divisionId === donation.divisionId &&
      request.districtId === donation.districtId &&
      request.upazilaId === donation.upazilaId &&
      normalizeText(request.hospitalName) === normalizeText(donation.hospitalName) &&
      assignedBeforeDonation &&
      withinPlausibleWindow
    );
  });

  return matches.length === 1 ? matches[0] : null;
};
