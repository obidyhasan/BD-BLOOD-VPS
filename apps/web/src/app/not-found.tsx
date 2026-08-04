import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, MessageSquare, AlertTriangle } from "lucide-react";
import BackButton from "@/components/shared/BackButton/BackButton";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -ml-64 -mb-64" />

      <div className="relative z-10 max-w-2xl px-6 flex flex-col items-center justify-center gap-12 text-center">
        <div className="space-y-6">
          <div className="flex items-center justify-center">
            <div className="size-24 rounded-[2rem] bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-xl shadow-amber-500/5">
              <AlertTriangle className="size-12" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-8xl md:text-[12rem] font-black tracking-tighter text-foreground leading-none">
              404
            </h1>
            <h2 className="text-3xl md:text-5xl font-black text-foreground/90 uppercase tracking-tight">
              Page Not Found
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-md mx-auto leading-relaxed">
              {`The page you are looking for has been moved or doesn't exist in
              our hub. Let's get you back on track.`}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Button
            asChild
            className="h-16 rounded-[1.5rem] px-10 font-black text-lg shadow-xl shadow-primary/20 w-full sm:w-auto"
          >
            <Link href="/" className="flex items-center gap-2">
              <Home className="size-5" />
              BD Blood Home
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="h-16 rounded-[1.5rem] px-10 font-black text-lg border-border/50 hover:bg-background w-full sm:w-auto"
          >
            <Link href="/#contact" className="flex items-center gap-2">
              <MessageSquare className="size-5" />
              Contact Support
            </Link>
          </Button>
        </div>

        <BackButton />
      </div>
    </div>
  );
}
