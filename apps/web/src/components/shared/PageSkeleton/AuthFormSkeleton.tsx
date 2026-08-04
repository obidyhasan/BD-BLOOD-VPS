import { Skeleton } from "@/components/ui/skeleton";

type AuthFormVariant =
  | "login"
  | "change-password"
  | "forgot-password"
  | "reset-password"
  | "verify-email";

interface AuthFormSkeletonProps {
  variant?: AuthFormVariant;
}

export function AuthFormSkeleton({ variant = "login" }: AuthFormSkeletonProps) {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-zinc-950 flex flex-col lg:flex-row overflow-hidden">
      {/* ── Visual Side (Desktop) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 overflow-hidden items-center justify-center p-20">
        {/* Gradient overlays – real divs, not skeletons */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-primary/10 opacity-40 z-10" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -mr-96 -mt-96" />

        <div className="relative z-20 space-y-12 max-w-2xl">
          {/* Icon container */}
          <Skeleton className="size-24 rounded-[2.5rem] bg-white/10 border border-white/20" />

          {/* Title + subtitle */}
          <div className="space-y-6 py-4">
            <Skeleton className="h-16 w-64 rounded-2xl bg-white/20" />
            <Skeleton className="h-5 w-80 rounded-xl bg-white/10" />
          </div>
        </div>
      </div>

      {/* ── Form Side ── */}
      <div className="flex-1 flex flex-col px-6 py-16 relative bg-zinc-50/50 dark:bg-zinc-950/50 overflow-y-auto">
        {/* Back-to-home link */}
        <Skeleton className="h-4 w-28 rounded-lg absolute top-6 left-6" />

        <div className="m-auto w-full max-w-sm space-y-6">
          {/* Logo + heading */}
          <div className="space-y-4 text-center lg:text-left">
            <Skeleton className="h-10 w-44 mx-auto lg:mx-0 rounded-xl mb-8" />
            <Skeleton className="h-10 w-48 mx-auto lg:mx-0 rounded-2xl" />
            <Skeleton className="h-5 w-64 mx-auto lg:mx-0 rounded-xl" />
          </div>

          {/* Page-specific form skeleton */}
          <div className="space-y-4">
            {variant === "login" && <LoginFormSkeleton />}
            {variant === "change-password" && <ChangePasswordFormSkeleton />}
            {variant === "forgot-password" && <ForgotPasswordFormSkeleton />}
            {variant === "reset-password" && <ResetPasswordFormSkeleton />}
            {variant === "verify-email" && <VerifyEmailFormSkeleton />}
          </div>

          {/* Footer link */}
          <div className="flex flex-col gap-4 mt-6">
            <Skeleton className="h-4 w-48 mx-auto rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Page-specific form skeletons
   ──────────────────────────────────────────── */

function LoginFormSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Form fields */}
      <div className="space-y-6">
        <div className="grid gap-2">
          <Skeleton className="h-4 w-12 rounded-lg" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
        <div className="grid gap-2">
          <Skeleton className="h-4 w-20 rounded-lg" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-4 w-28 rounded-lg" />
        </div>
        <Skeleton className="h-14 w-full rounded-2xl bg-primary/20" />
      </div>

      {/* Separator */}
      <div className="relative mt-5">
        <Skeleton className="h-px w-full" />
      </div>

      {/* Google button */}
      <Skeleton className="h-14 w-full rounded-2xl" />
    </div>
  );
}

function ChangePasswordFormSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Skeleton className="h-4 w-28 rounded-lg" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
      <div className="grid gap-2">
        <Skeleton className="h-4 w-20 rounded-lg" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
      <div className="grid gap-2">
        <Skeleton className="h-4 w-24 rounded-lg" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-14 w-full rounded-2xl bg-primary/20" />
    </div>
  );
}

function ForgotPasswordFormSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Skeleton className="h-4 w-12 rounded-lg" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-14 w-full rounded-2xl bg-primary/20" />
    </div>
  );
}

function ResetPasswordFormSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Skeleton className="h-4 w-20 rounded-lg" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
      <div className="grid gap-2">
        <Skeleton className="h-4 w-24 rounded-lg" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-14 w-full rounded-2xl bg-primary/20" />
    </div>
  );
}

function VerifyEmailFormSkeleton() {
  return (
    <div className="space-y-6 text-center">
      <Skeleton className="size-16 mx-auto rounded-2xl bg-primary/10" />
      <Skeleton className="h-4 w-48 mx-auto rounded-lg" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
}
