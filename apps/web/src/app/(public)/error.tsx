"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="size-20 rounded-[2rem] bg-red-500/10 text-red-500 flex items-center justify-center">
        <AlertTriangle className="size-10" />
      </div>
      <div className="space-y-2 max-w-md">
        <h1 className="text-2xl font-black uppercase tracking-tight">
          Something Went Wrong
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          We could not load this page. Please try again or go back to the home
          page.
        </p>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          onClick={reset}
          className="rounded-2xl font-black uppercase text-xs "
        >
          Try again
        </Button>
        <Button
          variant="outline"
          asChild
          className="rounded-2xl font-black uppercase text-xs "
        >
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
