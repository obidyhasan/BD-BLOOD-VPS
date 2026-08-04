import { Skeleton } from "@/components/ui/skeleton";

export function AuthRegisterSkeleton() {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-zinc-950 flex flex-col lg:flex-row overflow-hidden">
      {/* ── Form Side ── */}
      <div className="flex-1 flex flex-col p-8 md:p-12 lg:p-20 relative bg-zinc-50/50 dark:bg-zinc-950/50 overflow-y-auto order-2 lg:order-1 py-16">
        {/* Back to Home */}
        <Skeleton className="h-4 w-28 rounded-lg absolute top-6 left-6" />

        <div className="m-auto w-full max-w-2xl space-y-6">
          {/* Logo + heading */}
          <div className="space-y-4 text-center lg:text-left">
            <Skeleton className="h-10 w-44 mx-auto lg:mx-0 rounded-xl mb-8" />
            <Skeleton className="h-10 w-48 mx-auto lg:mx-0 rounded-2xl" />
            <Skeleton className="h-5 w-64 mx-auto lg:mx-0 rounded-xl" />
          </div>

          {/* Register form fields */}
          <div className="space-y-6">
            {/* Name + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Skeleton className="h-4 w-20 rounded-lg" />
                <Skeleton className="h-14 w-full rounded-2xl" />
              </div>
              <div className="grid gap-2">
                <Skeleton className="h-4 w-12 rounded-lg" />
                <Skeleton className="h-14 w-full rounded-2xl" />
              </div>
            </div>

            {/* Phone + Blood Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Skeleton className="h-4 w-24 rounded-lg" />
                <Skeleton className="h-14 w-full rounded-2xl" />
              </div>
              <div className="grid gap-2">
                <Skeleton className="h-4 w-24 rounded-lg" />
                <Skeleton className="h-14 w-full rounded-2xl" />
              </div>
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Skeleton className="h-4 w-20 rounded-lg" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>

            {/* Reference checkbox + field */}
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded-sm" />
                <Skeleton className="h-4 w-32 rounded-lg" />
              </div>
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>

            {/* Submit button */}
            <Skeleton className="h-14 w-full rounded-2xl bg-primary/20" />
          </div>

          {/* Footer link */}
          <div className="flex flex-col gap-6">
            <Skeleton className="h-4 w-40 mx-auto rounded-lg" />
          </div>
        </div>
      </div>

      {/* ── Visual Side ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 overflow-hidden items-center justify-center p-20 order-1 lg:order-2">
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-bl from-primary/30 via-transparent to-primary/10 opacity-40 z-10" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -ml-96 -mb-96" />

        <div className="relative z-20 space-y-12 max-w-2xl text-right">
          {/* Icon */}
          <div className="flex justify-end">
            <Skeleton className="size-24 rounded-[2.5rem] bg-white/10 border border-white/20" />
          </div>

          {/* Title + subtitle */}
          <div className="space-y-6">
            <Skeleton className="h-16 w-64 rounded-2xl bg-white/20 ml-auto" />
            <Skeleton className="h-5 w-80 rounded-xl bg-white/10 ml-auto" />
          </div>

          {/* Feature items */}
          <div className="flex flex-col gap-4 items-end pt-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-40 rounded-lg bg-white/10" />
                <Skeleton className="size-5 rounded-lg bg-primary/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
