"use client";

import { useSearchParams } from "next/navigation";
import { useSessionUser } from "@/hooks/useSessionUser";
import {
  useGetAllOrganizationsQuery,
  useGetMyMembershipQuery,
  useGetSingleOrganizationQuery,
} from "@/redux/features/organizations/organizationsApi";

export function useOrganizationDashboardContext() {
  const searchParams = useSearchParams();
  const {
    me,
    name,
    isLoading: userLoading,
    isFetching: userFetching,
  } = useSessionUser();
  const isAdmin = me?.role === "ADMIN";
  const selectedOrganizationId = searchParams.get("organizationId");

  const { data: organizationsData, isLoading: organizationsLoading } =
    useGetAllOrganizationsQuery(
      { limit: 1, organizationStatus: "ACTIVE" },
      { skip: !isAdmin || Boolean(selectedOrganizationId) },
    );

  const { data: membershipData, isLoading: membershipLoading } =
    useGetMyMembershipQuery(undefined, { skip: isAdmin });

  const organizationId = isAdmin
    ? (selectedOrganizationId ?? organizationsData?.data?.[0]?.id ?? "")
    : (membershipData?.data?.organizationId ?? "");

  const { data: organizationData, isLoading: organizationLoading } =
    useGetSingleOrganizationQuery(organizationId, { skip: !organizationId });

  return {
    me,
    name,
    isAdmin,
    organizationId,
    organization: organizationData?.data,
    membership: membershipData?.data ?? null,
    isLoading:
      userLoading ||
      userFetching ||
      organizationsLoading ||
      membershipLoading ||
      organizationLoading,
  };
}
