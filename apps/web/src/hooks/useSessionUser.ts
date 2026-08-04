"use client";

import { useGetMeQuery } from "@/redux/features/auth/authApi";

export function useSessionUser() {
  const { data, isLoading, isFetching } = useGetMeQuery(undefined, {
    skip: typeof window === "undefined",
  });
  const me = data?.data;

  return {
    name: me?.fullName ?? "User",
    email: me?.email ?? "",
    avatar: me?.profilePhoto ?? "",
    me,
    isLoading,
    isFetching,
  };
}
