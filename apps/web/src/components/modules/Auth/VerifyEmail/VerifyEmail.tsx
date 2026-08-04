"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import AuthWrapper from "@/components/shared/AuthWrapper/AuthWrapper";
import OtpInput from "@/components/shared/OtpInput/OtpInput";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/apiError";
import {
  useResendVerificationMutation,
  useVerifyEmailMutation,
} from "@/redux/features/auth/authApi";

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(email ? 60 : 0);
  const [verifyEmail, { isLoading: verifying }] = useVerifyEmailMutation();
  const [resendVerification, { isLoading: resending }] =
    useResendVerificationMutation();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    if (!email) {
      setError("We could not find your email. Please register again.");
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the complete 6-digit code.");
      return;
    }

    try {
      setError(null);
      const response = await verifyEmail({ email, otp }).unwrap();
      setVerified(true);
      toast.success(response.message || "Email verified successfully.");
    } catch (err: unknown) {
      const message = extractErrorMessage(
        err,
        "The code could not be verified. Request a new code and try again.",
      );
      setError(message);
      toast.error(message);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    try {
      setError(null);
      const response = await resendVerification({ email }).unwrap();
      setOtp("");
      setCooldown(response.data?.resendAvailableIn ?? 60);
      toast.success(response.message || "A new verification code was sent.");
    } catch (err: unknown) {
      const message = extractErrorMessage(err, "Could not send a new code.");
      setError(message);
      toast.error(message);
    }
  };

  return (
    <AuthWrapper
      title={verified ? "Email Verified" : "Verify Email"}
      subtitle={
        verified
          ? "Your donor account is ready. Sign in to continue."
          : "Enter the secure code sent to your email address."
      }
      visualTitle="One Step\nAway."
      visualSubtitle="Email verification keeps our donor network trusted and secure."
    >
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {verified ? <CheckCircle2 className="size-8" /> : <MailCheck className="size-8" />}
        </div>

        {verified ? (
          <>
            <p className="text-sm font-medium text-muted-foreground">
              Your email address has been confirmed. You can now access your account.
            </p>
            <Button
              className="h-12 w-full rounded-xl text-xs font-black uppercase"
              onClick={() => router.push("/login")}
            >
              Continue to login
            </Button>
          </>
        ) : (
          <>
            {email ? (
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to <strong className="text-foreground">{email}</strong>.
                It expires in 5 minutes.
              </p>
            ) : (
              <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                No email address was provided. Return to registration to request a code.
              </p>
            )}

            <OtpInput
              value={otp}
              onChange={(value) => {
                setOtp(value);
                setError(null);
              }}
              disabled={verifying || !email}
              error={Boolean(error)}
            />

            {error && <p className="text-sm font-semibold text-destructive">{error}</p>}

            <Button
              className="h-12 w-full rounded-xl text-xs font-black uppercase"
              onClick={handleVerify}
              disabled={verifying || otp.length !== 6 || !email}
            >
              {verifying ? <Loader2 className="size-4 animate-spin" /> : "Verify email"}
            </Button>

            <Button
              variant="outline"
              className="h-12 w-full rounded-xl text-xs font-black uppercase"
              onClick={handleResend}
              disabled={resending || cooldown > 0 || !email}
            >
              {resending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : cooldown > 0 ? (
                `Resend code in ${cooldown}s`
              ) : (
                "Resend code"
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              Wrong email?{" "}
              <Link href="/register" className="font-bold text-primary hover:underline">
                Register again
              </Link>
              {" · "}
              <Link href="/login" className="font-bold text-primary hover:underline">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthWrapper>
  );
}
