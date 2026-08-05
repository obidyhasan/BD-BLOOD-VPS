import { baseApi } from "../../api/baseApi";

export type OrganizationLevel = "CENTRAL" | "DIVISION" | "DISTRICT" | "UPAZILA";

export interface OrganizationTreeNode {
  id: string;
  name: string;
  level: OrganizationLevel;
  parentId?: string | null;
  divisionId: string;
  districtId: string;
  upazilaId: string;
  logo?: string | null;
  address: string;
  division?: { name: string };
  district?: { name: string };
  upazila?: { name: string };
  _count: { donorAffiliations: number; members: number };
  children: OrganizationTreeNode[];
}

export interface AffiliatedDonor {
  id: string;
  assignedAt: string;
  source: "PROFILE" | "ADMIN" | "MIGRATION";
  donor: {
    id: string;
    fullName: string;
    phone?: string | null;
    phoneVerifiedAt?: string | null;
    profilePhoto?: string | null;
    availabilityStatus: "AVAILABLE" | "UNAVAILABLE";
    accountStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    profileStatus: "INCOMPLETE" | "COMPLETE";
    lastDonationDate?: string | null;
    nextEligibleDonationDate?: string | null;
    bloodGroup: { groupName: string };
    division?: { name: string } | null;
    district?: { name: string } | null;
    upazila?: { name: string } | null;
  };
}

export interface Organization {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address: string;
  divisionId: string;
  districtId: string;
  upazilaId: string;
  division?: { name: string };
  district?: { name: string };
  upazila?: { name: string };
  level?: OrganizationLevel;
  parentId?: string | null;
  canonical?: boolean;
  description?: string | null;
  logo?: string | null;
  // type matches frontend OrganizationNode.type ("Main Hub", "Regional Branch")
  type?: string | null;
  // organizationStatus matches frontend OrganizationNode.status
  organizationStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  _count?: { members: number };
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  category: "COMMITTEE" | "ADVISOR";
  // null -> National/Central member (not tied to any Organization)
  organizationId: string | null;
  donorId: string;
  positionId: string;
  joinedAt: string;
  status: "ACTIVE" | "PENDING" | "REJECTED";
  donor: {
    id: string;
    slug?: string | null;
    fullName: string;
    email?: string;
    phone?: string | null;
    profilePhoto?: string | null;
    bio?: string | null;
    bloodGroup: { groupName: string };
    divisionId?: string | null;
    districtId?: string | null;
    upazilaId?: string | null;
    division?: { name: string } | null;
    district?: { name: string } | null;
    upazila?: { name: string } | null;
    lastDonationDate?: string | null;
    nextEligibleDonationDate?: string | null;
    availabilityStatus: "AVAILABLE" | "UNAVAILABLE";
    accountStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    isVerified: boolean;
  };
  organization?: {
    id: string;
    name: string;
  } | null;
  position: {
    id: string;
    positionName: string;
    positionOrder: number;
    level: "EXECUTIVE" | "MANAGEMENT" | "SUPPORT";
    positionStatus: "MAIN_ROLE" | "ASSISTANT" | "ACTIVE" | "GENERAL";
  };
  canAccessDashboard?: boolean;
}

export interface OrganizationPosition {
  id: string;
  positionName: string;
  positionOrder: number;
  level: "EXECUTIVE" | "MANAGEMENT" | "SUPPORT";
  positionStatus: "MAIN_ROLE" | "ASSISTANT" | "ACTIVE" | "GENERAL";
  members?: OrganizationMember[];
}

export const organizationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllOrganizations: builder.query<
      { success: boolean; meta: object; data: Organization[] },
      {
        page?: number;
        limit?: number;
        searchTerm?: string;
        verificationStatus?: string;
        organizationStatus?: string;
        divisionId?: string;
        districtId?: string;
        upazilaId?: string;
        type?: string;
      } | void
    >({
      query: (params) => {
        const qp = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) qp.append(k, String(v));
          });
        }
        const qs = qp.toString();
        return { url: `/organizations${qs ? `?${qs}` : ""}` };
      },
      providesTags: ["Organizations"],
    }),

    getOrganizationTree: builder.query<
      { success: boolean; data: OrganizationTreeNode[] },
      void
    >({
      query: () => ({ url: "/organizations/tree" }),
      providesTags: ["Organizations"],
    }),

    getCanonicalOrganizationByUpazila: builder.query<
      { success: boolean; data: Organization },
      string
    >({
      query: (upazilaId) => ({ url: `/organizations/by-upazila/${upazilaId}` }),
      providesTags: (_, __, upazilaId) => [
        { type: "Organizations", id: `upazila-${upazilaId}` },
      ],
    }),

    getAffiliatedDonors: builder.query<
      { success: boolean; data: AffiliatedDonor[] },
      string
    >({
      query: (organizationId) => ({
        url: `/organizations/${organizationId}/donors`,
      }),
      providesTags: ["OrganizationMembers"],
    }),

    getSingleOrganization: builder.query<
      { success: boolean; data: Organization },
      string
    >({
      query: (id) => ({ url: `/organizations/${id}` }),
      providesTags: (_, __, id) => [{ type: "Organizations", id }],
    }),

    getOrganizationBySlug: builder.query<
      { success: boolean; data: Organization },
      string
    >({
      query: (slug) => ({ url: `/organizations/by-slug/${slug}` }),
      providesTags: (_, __, slug) => [{ type: "Organizations", id: slug }],
    }),

    createOrganization: builder.mutation<
      { success: boolean; data: Organization },
      Partial<Organization>
    >({
      query: (data) => ({ url: "/organizations", method: "POST", body: data }),
      invalidatesTags: ["Organizations"],
    }),

    updateOrganization: builder.mutation<
      { success: boolean; data: Organization },
      { id: string; data: Partial<Organization> }
    >({
      query: ({ id, data }) => ({
        url: `/organizations/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Organizations", "OrganizationMembers"],
    }),

    registerOrganization: builder.mutation<
      { success: boolean; data: Organization },
      Omit<
        Organization,
        "id" | "createdAt" | "members" | "district" | "verificationStatus"
      >
    >({
      query: (data) => ({
        url: "/organizations/register",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Organizations"],
    }),

    updateOrganizationVerification: builder.mutation<
      { success: boolean; data: Organization },
      { id: string; verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" }
    >({
      query: ({ id, verificationStatus }) => ({
        url: `/organizations/${id}/verify`,
        method: "PATCH",
        body: { verificationStatus },
      }),
      invalidatesTags: ["Organizations"],
    }),

    deleteOrganization: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({ url: `/organizations/${id}`, method: "DELETE" }),
      invalidatesTags: ["Organizations"],
    }),

    // Organization members
    getAllOrganizationMembers: builder.query<
      { success: boolean; data: OrganizationMember[] },
      void
    >({
      query: () => ({ url: "/organization-members/admin/all" }),
      providesTags: ["OrganizationMembers"],
    }),

    getOrganizationMembers: builder.query<
      { success: boolean; data: OrganizationMember[] },
      string
    >({
      query: (organizationId) => ({
        url: `/organization-members/organization/${organizationId}`,
      }),
      providesTags: ["OrganizationMembers"],
    }),

    getPublicOrganizationMembers: builder.query<
      { success: boolean; data: OrganizationMember[] },
      string
    >({
      query: (organizationId) => ({
        url: `/organization-members/organization/${organizationId}/public`,
      }),
      providesTags: ["OrganizationMembers"],
    }),

    getPublicLeadershipMembers: builder.query<
      { success: boolean; data: OrganizationMember[] },
      {
        level: "EXECUTIVE" | "MANAGEMENT";
        organizationId?: string;
        divisionId?: string;
        districtId?: string;
      }
    >({
      query: ({ level, organizationId, divisionId, districtId }) => {
        const qp = new URLSearchParams({ level });
        if (organizationId) qp.set("organizationId", organizationId);
        if (divisionId) qp.set("divisionId", divisionId);
        if (districtId) qp.set("districtId", districtId);
        return {
          url: `/organization-members/public/leadership?${qp.toString()}`,
        };
      },
      providesTags: ["OrganizationMembers"],
    }),

    getMyMembership: builder.query<
      { success: boolean; data: OrganizationMember | null },
      void
    >({
      query: () => ({ url: "/organization-members/me" }),
      providesTags: ["OrganizationMembers"],
    }),

    assignOrganizationMember: builder.mutation<
      { success: boolean; data: OrganizationMember },
      {
        donorId: string;
        positionId: string;
        organizationId?: string;
        category?: "COMMITTEE" | "ADVISOR";
      }
    >({
      query: (data) => ({
        url: "/organization-members/assign",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["OrganizationMembers"],
    }),

    joinOrganization: builder.mutation<
      { success: boolean; data: OrganizationMember },
      { organizationId: string; positionId: string }
    >({
      query: (data) => ({
        url: "/organization-members/join",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["OrganizationMembers"],
    }),

    updateMemberStatus: builder.mutation<
      { success: boolean; data: OrganizationMember },
      { memberId: string; status: "ACTIVE" | "PENDING" | "REJECTED" }
    >({
      query: ({ memberId, status }) => ({
        url: `/organization-members/${memberId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["OrganizationMembers"],
    }),

    leaveOrganization: builder.mutation<
      { success: boolean; message: string },
      void
    >({
      query: () => ({ url: "/organization-members/leave", method: "POST" }),
      invalidatesTags: ["OrganizationMembers"],
    }),

    // Positions
    getAllPositions: builder.query<
      { success: boolean; data: OrganizationPosition[] },
      void
    >({
      query: () => ({ url: "/organization-positions" }),
      providesTags: ["OrganizationPositions"],
    }),

    createPosition: builder.mutation<
      { success: boolean; data: OrganizationPosition },
      Omit<OrganizationPosition, "id" | "members">
    >({
      query: (data) => ({
        url: "/organization-positions",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["OrganizationPositions"],
    }),

    updatePosition: builder.mutation<
      { success: boolean; data: OrganizationPosition },
      { id: string; data: Partial<OrganizationPosition> }
    >({
      query: ({ id, data }) => ({
        url: `/organization-positions/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["OrganizationPositions"],
    }),

    deletePosition: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (id) => ({
        url: `/organization-positions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["OrganizationPositions"],
    }),
  }),
});

export const {
  useGetAllOrganizationsQuery,
  useLazyGetAllOrganizationsQuery,
  useGetOrganizationTreeQuery,
  useGetCanonicalOrganizationByUpazilaQuery,
  useLazyGetCanonicalOrganizationByUpazilaQuery,
  useGetAffiliatedDonorsQuery,
  useGetSingleOrganizationQuery,
  useGetOrganizationBySlugQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useRegisterOrganizationMutation,
  useUpdateOrganizationVerificationMutation,
  useDeleteOrganizationMutation,
  useGetAllOrganizationMembersQuery,
  useGetOrganizationMembersQuery,
  useGetPublicOrganizationMembersQuery,
  useGetPublicLeadershipMembersQuery,
  useGetMyMembershipQuery,
  useAssignOrganizationMemberMutation,
  useJoinOrganizationMutation,
  useUpdateMemberStatusMutation,
  useLeaveOrganizationMutation,
  useGetAllPositionsQuery,
  useCreatePositionMutation,
  useUpdatePositionMutation,
  useDeletePositionMutation,
} = organizationsApi;
