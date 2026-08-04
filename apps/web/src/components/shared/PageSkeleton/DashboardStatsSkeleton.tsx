import { Skeleton } from "@/components/ui/skeleton";

export function DashboardStatsSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-[2rem]" />
        ))}
      </div>

      {/* Chart area */}
      <Skeleton className="h-80 rounded-[2.5rem]" />

      {/* Secondary content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-56 rounded-[2rem]" />
        <Skeleton className="h-56 rounded-[2rem]" />
      </div>
    </div>
  );
}
