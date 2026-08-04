import { Skeleton } from "@/components/ui/skeleton";

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24 rounded-lg" />
        <Skeleton className="h-10 w-64 max-w-full rounded-2xl" />
        <Skeleton className="h-5 w-96 max-w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-[2rem]" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-[2.5rem]" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-56 rounded-[2rem]" />
        <Skeleton className="h-56 rounded-[2rem]" />
      </div>
    </div>
  );
}

export function PublicPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      <div className="space-y-4 text-center">
        <Skeleton className="h-6 w-40 mx-auto rounded-full" />
        <Skeleton className="h-12 w-96 max-w-full mx-auto rounded-2xl" />
        <Skeleton className="h-5 w-[32rem] max-w-full mx-auto rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-[2rem]" />
        ))}
      </div>
    </div>
  );
}
