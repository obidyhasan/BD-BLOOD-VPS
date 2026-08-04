import { Skeleton } from "@/components/ui/skeleton";

export function DashboardTableSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Table header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>

      {/* Search / filter bar */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>

      {/* Table rows */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-3 rounded-lg border border-border/40"
          >
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32 rounded-lg" />
            <Skeleton className="h-4 w-48 rounded-lg" />
            <Skeleton className="h-4 w-20 rounded-lg" />
            <Skeleton className="h-6 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
