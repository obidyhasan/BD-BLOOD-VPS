"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Link from "next/link";
import { extractErrorMessage } from "@/lib/apiError";
import AuthWrapper from "@/components/shared/AuthWrapper/AuthWrapper";
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
import { useChangePasswordMutation } from "@/redux/features/auth/authApi";
import { Loader2 } from "lucide-react";

const formSchema = z
  .object({
    oldPassword: z.string().min(1, { message: "Current password is required" }),
    newPassword: z
      .string()
      .min(12, { message: "Password must be at least 12 characters" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function ChangePassword() {
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      }).unwrap();
      toast.success("Password updated successfully.");
      form.reset();
    } catch (err: unknown) {
      toast.error(
        extractErrorMessage(
          err,
          "Failed to update password. Please try again.",
        ),
      );
    }
  }

  return (
    <AuthWrapper
      title="Change Password"
      subtitle="Update your password to keep your account secure."
      visualTitle={"Change Your \n Password."}
      visualSubtitle="Security and trust are at the heart of our mission. Update your authentication vectors across the BD BLOOD network."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="oldPassword"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">
                    Current Password
                  </FormLabel>
                  <FormControl>
                    <Password
                      placeholder="Enter current password"
                      className="h-14 rounded-2xl border-border/40 bg-white dark:bg-zinc-900 focus:ring-primary/20 transition-all font-bold"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px] font-bold text-red-500 uppercase tracking-tight" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">
                    New Password
                  </FormLabel>
                  <FormControl>
                    <Password
                      placeholder="Enter new password"
                      className="h-14 rounded-2xl border-border/40 bg-white dark:bg-zinc-900 focus:ring-primary/20 transition-all font-bold"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px] font-bold text-red-500 uppercase tracking-tight" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="grid gap-2">
                  <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <Password
                      placeholder="Repeat new password"
                      className="h-14 rounded-2xl border-border/40 bg-white dark:bg-zinc-900 focus:ring-primary/20 transition-all font-bold"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[10px] font-bold text-red-500 uppercase tracking-tight" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase  shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      </Form>

      <div className="flex flex-col gap-4 mt-6">
        <p className="text-center text-sm font-bold text-muted-foreground">
          Want to go back?
          <Link
            className="ml-2 text-primary hover:underline decoration-2 underline-offset-4"
            href="/dashboard/donor/settings"
          >
            Settings
          </Link>
        </p>
      </div>
    </AuthWrapper>
  );
}
