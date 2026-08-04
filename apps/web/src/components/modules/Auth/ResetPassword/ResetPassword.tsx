"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AuthWrapper from "@/components/shared/AuthWrapper/AuthWrapper";
import { extractErrorMessage } from "@/lib/apiError";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import Password from "@/components/ui/password";
import { ResetPasswordSchema } from "@/zod/ResetPassword/ResetPasswordSchema";
import { useResetPasswordMutation } from "@/redux/features/auth/authApi";

const formSchema = ResetPasswordSchema;
type ResetAuthorization = {
  email: string;
  resetToken: string;
  expiresAt: number;
};

export default function ResetPassword() {
  const router = useRouter();
  const [authorization, setAuthorization] = useState<ResetAuthorization | null>(null);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  useEffect(() => {
    const hydrateAuthorization = window.setTimeout(() => {
      try {
        const stored = sessionStorage.getItem("passwordResetAuthorization");
        if (!stored) return;
        const parsed = JSON.parse(stored) as ResetAuthorization;
        if (
          !parsed.email ||
          !parsed.resetToken ||
          !parsed.expiresAt ||
          parsed.expiresAt <= Date.now()
        ) {
          sessionStorage.removeItem("passwordResetAuthorization");
          return;
        }
        setAuthorization(parsed);
      } catch {
        sessionStorage.removeItem("passwordResetAuthorization");
      }
    }, 0);

    return () => window.clearTimeout(hydrateAuthorization);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!authorization) {
      sessionStorage.removeItem("passwordResetAuthorization");
      setAuthorization(null);
      toast.error("Your reset session has expired. Request a new code.");
      return;
    }

    try {
      await resetPassword({
        email: authorization.email,
        resetToken: authorization.resetToken,
        password: values.password,
      }).unwrap();
      sessionStorage.removeItem("passwordResetAuthorization");
      toast.success("Password reset successful. You can now log in.");
      form.reset();
      router.push("/login");
    } catch (err: unknown) {
      const message = extractErrorMessage(
        err,
        "Could not reset your password. Get a new code and try again.",
      );
      toast.error(message);
      if (message.toLowerCase().includes("expired") || message.toLowerCase().includes("invalid")) {
        sessionStorage.removeItem("passwordResetAuthorization");
        setAuthorization(null);
      }
    }
  }

  return (
    <AuthWrapper
      title="Reset Password"
      subtitle="Create a new password after your email code has been verified."
      visualTitle={"Create a New \n Password."}
      visualSubtitle="We care about keeping your account safe."
    >
      {!authorization ? (
        <div className="space-y-6 text-center">
          <p className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
            Your password reset session is missing or expired. Request a new code to continue.
          </p>
          <Button
            className="h-12 w-full rounded-xl text-xs font-black uppercase"
            onClick={() => router.push("/forgot-password")}
          >
            Request a new code
          </Button>
        </div>
      ) : (
        <>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Set a new password for <strong className="text-foreground">{authorization.email}</strong>.
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel className="px-1 text-[10px] font-black uppercase  text-muted-foreground">
                        New Password
                      </FormLabel>
                      <FormControl>
                        <Password
                          placeholder="******"
                          autoComplete="new-password"
                          className="h-14 rounded-2xl border-border/40 bg-zinc-50 font-bold dark:bg-zinc-900"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="grid gap-2">
                      <FormLabel className="px-1 text-[10px] font-black uppercase  text-muted-foreground">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <Password
                          placeholder="******"
                          autoComplete="new-password"
                          className="h-14 rounded-2xl border-border/40 bg-zinc-50 font-bold dark:bg-zinc-900"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex h-14 items-center justify-center gap-3 rounded-2xl text-xs font-black uppercase "
                >
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : <><Lock className="size-4" /> Reset my password</>}
                </Button>
              </div>
            </form>
          </Form>
        </>
      )}
      <p className="mt-6 text-center text-sm font-bold text-muted-foreground">
        Remembered your password?{" "}
        <Link className="text-primary hover:underline" href="/login">Sign in</Link>
      </p>
    </AuthWrapper>
  );
}
