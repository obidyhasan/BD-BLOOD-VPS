import { Skeleton } from "@/components/ui/skeleton";

export function OrgOverviewSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Org header */}
      <div className="flex items-center gap-6">
        <Skeleton className="h-16 w-16 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded-lg" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-[2rem]" />
        ))}
      </div>

      {/* Blood inventory */}
      <Skeleton className="h-48 rounded-[2rem]" />

      {/* Activity / requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-40 rounded-[2rem]" />
        <Skeleton className="h-40 rounded-[2rem]" />
      </div>
    </div>
  );
}
