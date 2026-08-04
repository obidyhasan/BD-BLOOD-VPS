"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/features/auth/authSlice";
import { baseApi } from "@/redux/api/baseApi";
import { logoutUser } from "@/services/auth";
import { clearAuthSession } from "@/lib/syncAuthSession";

export const useLogout = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return useCallback(async () => {
    try {
      await clearAuthSession();
      await logoutUser();
    } catch {
      // Clear client state even if cookie cleanup fails.
    }

    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    toast.success("Logged out successfully");
    router.replace("/login");
    window.location.assign("/login");
  }, [dispatch, router]);
};
