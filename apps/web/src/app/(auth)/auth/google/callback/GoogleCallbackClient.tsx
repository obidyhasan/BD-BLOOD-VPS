"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { logout, setCredentials } from "@/redux/features/auth/authSlice";
import { clearAuthSession } from "@/lib/syncAuthSession";
import { organizationsApi } from "@/redux/features/organizations/organizationsApi";
import { toast } from "sonner";
import { authApi } from "@/redux/features/auth/authApi";

export default function GoogleCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState("Completing Google sign-in...");

  useEffect(() => {
    const redirectToLoginAfterFailure = async (message: string) => {
      setMessage(message);
      dispatch(logout());
      await clearAuthSession().catch(() => undefined);
      toast.error("Google sign-in failed.");
      router.replace("/login");
    };

    const run = async () => {
      const error = searchParams.get("error");
      if (error) {
        await redirectToLoginAfterFailure(error);
        return;
      }

      try {
        const meResult = await dispatch(
          authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true }),
        ).unwrap();

        const user = meResult.data;
        dispatch(setCredentials({ user, token: "" }));

        toast.success("Signed in with Google");

        if (user.role === "ADMIN") {
          router.replace("/dashboard/admin/analytics");
          return;
        }

        try {
          const membership = await dispatch(
            organizationsApi.endpoints.getMyMembership.initiate(undefined, {
              forceRefetch: true,
            }),
          ).unwrap();
          if (membership.data?.status === "ACTIVE") {
            router.replace("/dashboard/organization");
          } else {
            router.replace("/dashboard/donor");
          }
        } catch {
          router.replace("/dashboard/donor");
        }
      } catch {
        await redirectToLoginAfterFailure("Failed to complete sign-in.");
      }
    };

    void run();
  }, [dispatch, router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
      <Loader2 className="size-10 animate-spin text-primary" />
      <p className="text-sm font-bold text-muted-foreground">{message}</p>
    </div>
  );
}
