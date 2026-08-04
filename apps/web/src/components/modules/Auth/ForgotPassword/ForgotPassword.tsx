"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import AuthWrapper from "@/components/shared/AuthWrapper/AuthWrapper";
import OtpInput from "@/components/shared/OtpInput/OtpInput";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractErrorMessage } from "@/lib/apiError";
import {
  useForgotPasswordMutation,
  useVerifyPasswordResetOtpMutation,
} from "@/redux/features/auth/authApi";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
});

export default function ForgetPassword() {
  const router = useRouter();
  const [forgotPassword, { isLoading: sending }] = useForgotPasswordMutation();
  const [verifyOtp, { isLoading: verifying }] =
    useVerifyPasswordResetOtpMutation();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setError(null);
      const normalizedEmail = values.email.trim().toLowerCase();
      const response = await forgotPassword({ email: normalizedEmail }).unwrap();
      setEmail(normalizedEmail);
      setCooldown(response.data?.resendAvailableIn ?? 60);
      toast.success(response.message || "If the account exists, a reset code was sent.");
    } catch (err: unknown) {
      const message = extractErrorMessage(err, "Could not request a reset code.");
      setError(message);
      toast.error(message);
    }
  }

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the complete 6-digit code.");
      return;
    }

    try {
      setError(null);
      const response = await verifyOtp({ email, otp }).unwrap();
      sessionStorage.setItem(
        "passwordResetAuthorization",
        JSON.stringify({
          email,
          resetToken: response.data.resetToken,
          expiresAt: Date.now() + response.data.expiresIn * 1000,
        }),
      );
      toast.success(response.message || "Code verified. Create a new password.");
      router.push("/reset-password");
    } catch (err: unknown) {
      const message = extractErrorMessage(err, "The code is invalid or has expired.");
      setError(message);
      toast.error(message);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    try {
      setError(null);
      const response = await forgotPassword({ email }).unwrap();
      setOtp("");
      setCooldown(response.data?.resendAvailableIn ?? 60);
      toast.success(response.message || "A new reset code was sent.");
    } catch (err: unknown) {
      const message = extractErrorMessage(err, "Could not send a new code.");
      setError(message);
      toast.error(message);
    }
  };

  if (email) {
    return (
      <AuthWrapper
        title="Verify Reset Code"
        subtitle="Confirm the code, then create your new password."
        visualTitle={"Reset Your \n Password."}
        visualSubtitle="This code is only valid for a short time."
      >
        <div className="space-y-6 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MailCheck className="size-8" />
          </div>
          <p className="text-sm text-muted-foreground">
            If an active account exists, a 6-digit code was sent to{" "}
            <strong className="text-foreground">{email}</strong>. It expires in 5 minutes.
          </p>
          <OtpInput
            value={otp}
            onChange={(value) => {
              setOtp(value);
              setError(null);
            }}
            disabled={verifying}
            error={Boolean(error)}
          />
          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
          <Button
            className="h-12 w-full rounded-xl text-xs font-black uppercase"
            onClick={handleVerify}
            disabled={verifying || otp.length !== 6}
          >
            {verifying ? <Loader2 className="size-4 animate-spin" /> : "Verify code"}
          </Button>
          <Button
            variant="outline"
            className="h-12 w-full rounded-xl text-xs font-black uppercase"
            onClick={handleResend}
            disabled={sending || cooldown > 0}
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : cooldown > 0 ? (
              `Resend code in ${cooldown}s`
            ) : (
              "Resend code"
            )}
          </Button>
          <button
            type="button"
            className="text-xs font-bold text-primary hover:underline"
            onClick={() => {
              setEmail("");
              setOtp("");
              setError(null);
              setCooldown(0);
            }}
          >
            Use a different email
          </button>
        </div>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper
      title="Forgot Password"
      subtitle="Enter your email to receive a secure 6-digit reset code."
      visualTitle={"Reset Your \n Password."}
      visualSubtitle="Security and trust are at the heart of our mission."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel className="px-1 text-[10px] font-black uppercase  text-muted-foreground">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="johndoe@mail.com"
                    type="email"
                    autoComplete="email"
                    className="h-14 rounded-2xl border-border/40 bg-white font-bold dark:bg-zinc-900"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
          <Button
            type="submit"
            disabled={sending}
            className="h-14 w-full rounded-2xl text-xs font-black uppercase "
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : "Send reset code"}
          </Button>
        </form>
      </Form>
      <p className="mt-6 text-center text-sm font-bold text-muted-foreground">
        Remembered your password?{" "}
        <Link className="text-primary hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </AuthWrapper>
  );
}
