import { Skeleton } from "@/components/ui/skeleton";

export function PostCardSkeleton() {
  return (
    <div className="h-full rounded-[2.5rem] border border-border/40 bg-white dark:bg-zinc-950 overflow-hidden flex flex-col">
      <div className="p-6 pb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="h-3 w-32 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="aspect-[16/9] mx-6 rounded-2xl" />
      <div className="p-6 flex-1 flex flex-col gap-3">
        <Skeleton className="h-6 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-5/6 rounded-lg" />
        <div className="mt-auto pt-6 border-t border-border/40 flex items-center justify-between">
          <div className="flex gap-6">
            <Skeleton className="h-4 w-12 rounded-lg" />
            <Skeleton className="h-4 w-12 rounded-lg" />
          </div>
          <Skeleton className="size-8 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
