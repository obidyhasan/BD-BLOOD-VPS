import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import GoogleCallbackClient from "./GoogleCallbackClient";

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-sm font-bold text-muted-foreground">
            Completing Google sign-in...
          </p>
        </div>
      }
    >
      <GoogleCallbackClient />
    </Suspense>
  );
}
