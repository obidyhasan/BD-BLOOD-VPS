"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/zod/Login/LoginSchema";
import { Button } from "@/components/ui/button";
import Password from "@/components/ui/password";
import { toast } from "sonner";
import Link from "next/link";
import { useAppDispatch } from "@/redux/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useLoginMutation,
} from "@/redux/features/auth/authApi";
import { setCredentials } from "@/redux/features/auth/authSlice";
import { organizationsApi } from "@/redux/features/organizations/organizationsApi";
import { AlertCircle, CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { extractErrorCode, extractErrorMessage } from "@/lib/apiError";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
} from "@/components/ui/alert";

const REGISTRATION_VERIFICATION_MESSAGE =
  "Registration successful. Enter the 6-digit code sent to your email to log in.";

const LoginForm = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [login, { isLoading }] = useLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [registrationReminder] = useState<string | null>(() =>
    searchParams.get("registered") === "1"
      ? REGISTRATION_VERIFICATION_MESSAGE
      : null,
  );

  const form = useForm<z.infer<typeof loginSchema>>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const registered = searchParams.get("registered");
    if (registered !== "1") return;

    toast.success(REGISTRATION_VERIFICATION_MESSAGE, {
      id: "registration-verification-reminder",
    });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("registered");
    const nextUrl = params.toString()
      ? `/login?${params.toString()}`
      : "/login";
    router.replace(nextUrl, { scroll: false });
  }, [router, searchParams]);

  const handleResendVerification = () => {
    const email = form.getValues("email")?.trim().toLowerCase();
    if (!email) {
      form.setError("email", {
        type: "manual",
        message: "Enter your email to continue.",
      });
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  };

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      setFormError(null);
      setShowResendVerification(false);
      const result = await login(data).unwrap();

      // IMPORTANT
      if (!result.success) {
        toast.error(result.message || "Login failed");
        return;
      }

      dispatch(
        setCredentials({
          user: result.data.user,
        }),
      );

      toast.success("Logged in successfully");

      const callbackUrl = searchParams.get("callbackUrl");
      const safeCallbackUrl =
        callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
          ? callbackUrl
          : null;

      if (result.data.user.role === "ADMIN") {
        router.push(safeCallbackUrl ?? "/dashboard/admin/analytics");
        return;
      }

      try {
        const membership = await dispatch(
          organizationsApi.endpoints.getMyMembership.initiate(undefined, {
            forceRefetch: true,
          }),
        ).unwrap();
        if (
          membership.data?.status === "ACTIVE" &&
          membership.data?.canAccessDashboard
        ) {
          router.push(
            safeCallbackUrl && !safeCallbackUrl.startsWith("/dashboard/admin")
              ? safeCallbackUrl
              : "/dashboard/organization",
          );
        } else {
          router.push(
            safeCallbackUrl &&
              (safeCallbackUrl.startsWith("/dashboard/donor") ||
                safeCallbackUrl.startsWith("/change-password"))
              ? safeCallbackUrl
              : "/dashboard/donor",
          );
        }
      } catch {
        router.push(
          safeCallbackUrl &&
            (safeCallbackUrl.startsWith("/dashboard/donor") ||
              safeCallbackUrl.startsWith("/change-password"))
            ? safeCallbackUrl
            : "/dashboard/donor",
        );
      }
    } catch (err: unknown) {
      const message = extractErrorMessage(
        err,
        "Login failed. Check your email and password.",
      );
      const errorCode = extractErrorCode(err);

      setFormError(message);
      setShowResendVerification(errorCode === "EMAIL_NOT_VERIFIED");
      toast.error(message);
    }
  };

  return (
    <Form {...form}>
      <form
        className="w-full space-y-6 mt-2"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {registrationReminder && (
          <Alert variant="success" appearance="light" className="rounded-2xl">
            <AlertIcon>
              <CheckCircle2 className="size-5" />
            </AlertIcon>
            <AlertContent>
              <AlertDescription className="font-semibold">
                {registrationReminder}
              </AlertDescription>
            </AlertContent>
          </Alert>
        )}

        {formError && (
          <Alert
            variant={showResendVerification ? "warning" : "destructive"}
            appearance="light"
            className="rounded-2xl"
          >
            <AlertIcon>
              {showResendVerification ? (
                <MailWarning className="size-5" />
              ) : (
                <AlertCircle className="size-5" />
              )}
            </AlertIcon>
            <AlertContent>
              <AlertDescription className="font-semibold">
                {formError}
              </AlertDescription>
              {showResendVerification && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  className="mt-2 h-10 rounded-xl font-black text-[10px] uppercase "
                >
                  Verify email with code
                </Button>
              )}
            </AlertContent>
          </Alert>
        )}

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase  text-muted-foreground/60 ml-1">
                  Email or Phone Number
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter email or phone number"
                    className="h-14 rounded-2xl border-border/40 focus:border-primary transition-all bg-white dark:bg-zinc-900/50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase  text-muted-foreground/60 ml-1">
                  Password
                </FormLabel>
                <FormControl>
                  <Password
                    className="h-14 rounded-2xl border-border/40 focus:border-primary transition-all bg-white dark:bg-zinc-900/50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Link
            className="ml-1 text-right text-primary/60 hover:text-primary transition-colors text-xs font-bold "
            href="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>

        <div className="space-y-3">
          <Button
            disabled={isLoading}
            className="w-full h-14 rounded-2xl font-black text-xs uppercase  bg-primary hover:bg-emerald-600 shadow-xl shadow-primary/20 border-none transition-all hover:scale-[1.02] active:scale-95"
            type="submit"
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Login"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LoginForm;
