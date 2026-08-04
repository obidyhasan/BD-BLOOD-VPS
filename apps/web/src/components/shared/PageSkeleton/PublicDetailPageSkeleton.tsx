import { Skeleton } from "@/components/ui/skeleton";

export function PublicDetailPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 animate-in fade-in duration-300">
      {/* Hero section */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded-full" />
        <Skeleton className="h-12 w-3/4 max-w-full rounded-2xl" />
        <Skeleton className="h-5 w-2/3 max-w-full rounded-xl" />
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="h-64 w-full rounded-[2rem]" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-32 rounded-lg" />
          <Skeleton className="h-6 w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <Skeleton className="h-6 w-full rounded-xl" />
        </div>
      </div>

      {/* Sidebar info */}
      <div className="space-y-6">
        <Skeleton className="h-40 w-40 rounded-full" />
        <Skeleton className="h-4 w-24 rounded-lg" />
        <Skeleton className="h-3 w-20 rounded-lg" />
        <Skeleton className="h-3 w-20 rounded-lg" />
        <Skeleton className="h-3 w-16 rounded-lg" />
      </div>
    </div>
  );
}
