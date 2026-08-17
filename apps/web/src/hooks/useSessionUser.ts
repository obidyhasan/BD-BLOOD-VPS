"use client";

import { useEffect } from "react";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useAppDispatch } from "@/redux/hooks";
import { setCredentials } from "@/redux/features/auth/authSlice";

export function useSessionUser() {
  const dispatch = useAppDispatch();
  const { data, isLoading, isFetching, isError } = useGetMeQuery(undefined, {
    skip: typeof window === "undefined",
  });
  const me = data?.data;

  useEffect(() => {
    if (me) dispatch(setCredentials({ user: me }));
  }, [dispatch, me]);

  return {
    name: me?.fullName ?? "User",
    email: me?.email ?? "",
    avatar: me?.profilePhoto ?? "",
    me,
    isLoading,
    isFetching,
    isError,
    isResolved: !isLoading,
  };
}
