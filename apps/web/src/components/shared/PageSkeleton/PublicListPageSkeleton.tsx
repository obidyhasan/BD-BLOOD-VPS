import { Skeleton } from "@/components/ui/skeleton";

export function PublicListPageSkeleton({
  variant = "card",
}: {
  variant?: "card" | "grid" | "table";
}) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-4 text-center">
        <Skeleton className="h-6 w-40 mx-auto rounded-full" />
        <Skeleton className="h-12 w-80 max-w-full mx-auto rounded-2xl" />
        <Skeleton className="h-5 w-[32rem] max-w-full mx-auto rounded-xl" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 justify-center">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-48 rounded-xl" />
      </div>

      {/* Content grid */}
      <div
        className={
          variant === "card"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            : variant === "table"
              ? "space-y-6"
              : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        }
      >
        {Array.from({ length: variant === "card" ? 6 : 5 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-[2rem]" />
        ))}
      </div>
    </div>
  );
}
