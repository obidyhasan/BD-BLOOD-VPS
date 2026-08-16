export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: "DONOR" | "ADMIN";
  accountStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  availabilityStatus: "AVAILABLE" | "UNAVAILABLE";
  bloodGroupId: string;
  bloodGroup?: { groupName: string };
  divisionId?: string | null;
  districtId?: string | null;
  upazilaId?: string | null;
  division?: { name: string } | null;
  district?: { name: string } | null;
  upazila?: { name: string } | null;
  profilePhoto?: string | null;
  bio?: string | null;
  lastDonationDate?: string | null;
  nextEligibleDonationDate?: string | null;
  isVerified: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  phoneVerifiedAt?: string | null;
  profileStatus?: "INCOMPLETE" | "COMPLETE";
  profileCompletedAt?: string | null;
  missingProfileFields?: string[];
  affiliation?: {
    organizationId?: string;
    upazilaId?: string;
    organization?: { id: string; name: string; level?: string };
  } | null;
  cooldown?: {
    lastDonationAt?: string | null;
    nextEligibleDonationAt?: string | null;
    eligibleNow: boolean;
  };
  capabilities?: {
    canAcceptBloodRequests: boolean;
    canSubmitDonation: boolean;
    canCreateDonationPost: boolean;
    canAccessOrganizationDashboard: boolean;
    nextEligibleDonationAt?: string | null;
  };
  notifyInApp?: boolean;
  notifySms?: boolean;
  notifyEmail?: boolean;
  referralCount?: number;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  bloodGroupId?: string;
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  role?: "DONOR" | "ADMIN";
  referenceEmail?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: Record<string, never>;
}
