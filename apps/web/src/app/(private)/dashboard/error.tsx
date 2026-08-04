"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 px-6 text-center">
      <div className="size-20 rounded-[2rem] bg-amber-500/10 text-amber-500 flex items-center justify-center">
        <ShieldAlert className="size-10" />
      </div>
      <div className="space-y-2 max-w-md">
        <h1 className="text-2xl font-black uppercase tracking-tight">Dashboard error</h1>
        <p className="text-sm text-muted-foreground font-medium">
          This section failed to load. Your session is still active — try refreshing this view.
        </p>
      </div>
      <Button onClick={reset} className="rounded-2xl font-black uppercase text-xs ">
        Retry
      </Button>
    </div>
  );
}
