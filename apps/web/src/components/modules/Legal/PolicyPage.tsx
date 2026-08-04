"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Fingerprint,
  EyeOff,
  ShieldAlert,
  Clock,
  ArrowRight,
  ExternalLink,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PolicyPage = () => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-24 pb-32 animate-in fade-in duration-1000">
      <div className="max-w-4xl mx-auto px-6 space-y-16">
        {/* Cinematic Header */}
        <header className="space-y-6 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-4">
              <Badge
                variant="outline"
                className="rounded-full px-4 py-1 border-primary/20 text-primary font-black text-[9px] uppercase  bg-primary/5"
              >
                Information Architecture
              </Badge>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-none  select-none">
                Privacy{" "}
                <span className="text-primary font-normal not-">&</span>{" "}
                Data
              </h1>
              <div className="flex items-center gap-3 justify-center lg:justify-start text-[10px] font-black uppercase text-muted-foreground opacity-40  ">
                <Clock className="size-3" />
                Last Data Integrity Sync: April 05, 2026
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-4 h-16 px-8 rounded-2xl bg-zinc-950 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-zinc-950/20 translate-y-2">
              BDB-POLICY-V.01
            </div>
          </div>
        </header>

        {/* Policy Architecture */}
        <section className="space-y-12">
          <div className="p-12 md:p-16 rounded-[4rem] bg-white dark:bg-zinc-900 border border-border/40 shadow-none border-dashed relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -ml-48 -mt-48 transition-all group-hover:bg-primary/10" />

            <div className="relative z-10 space-y-16">
              {/* Section 1: Telemetry */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-[1.25rem] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-xs text-primary shadow-sm border border-border/40">
                    P1
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3">
                    <Fingerprint className="size-5 text-primary" />
                    Collection Protocol
                  </h3>
                </div>
                <p className="text-base md:text-lg font-medium text-muted-foreground leading-relaxed  border-l-4 border-primary/10 pl-8 ml-6">
                  &quot;BD BLOOD systems collect user-originated node profile,
                  geographical location, and encrypted communication data to
                  streamline blood broadcast operations and regional clinical
                  coordination. Data is utilized exclusively for emergency
                  response verification and healthcare telemetry.&quot;
                </p>
              </div>

              {/* Section 2: Authorization */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-[1.25rem] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-xs text-primary shadow-sm border border-border/40">
                    P2
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3">
                    <Lock className="size-5 text-primary" />
                    Permission Hierarchy
                  </h3>
                </div>
                <p className="text-base md:text-lg font-medium text-muted-foreground leading-relaxed  border-l-4 border-primary/10 pl-8 ml-6">
                  &quot;Strict role-based access control (RBAC) vectors are
                  applied to all medical and organizational identifiers.
                  Sensitive records are encrypted and visibility is strictly
                  managed via command-hub dashboards and oversight-moderation
                  cycles.&quot;
                </p>
              </div>

              {/* Section 3: Data Integrity Alert */}
              <div className="space-y-8 pt-8 border-t border-border/20">
                <div className="p-10 rounded-[3rem] bg-emerald-500/5 text-emerald-600  group/data flex flex-col md:flex-row md:items-center justify-between gap-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <ShieldCheck className="size-8 text-emerald-500 shrink-0" />
                      <h4 className="text-2xl font-black tracking-tighter uppercase">
                        E2EE Protection
                      </h4>
                    </div>
                    <p className="text-emerald-900/60 text-sm font-medium leading-relaxed max-w-md">
                      All mission-critical clinical communications are
                      end-to-end encrypted across the BD BLOOD network, ensuring
                      peak-node privacy.
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-4 h-16 px-8 rounded-2xl bg-white/40 dark:bg-zinc-800/40 border border-border/40 text-[10px] font-black uppercase ">
                    Active Security V2.4
                    <Activity className="size-3.5 text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Navigation */}
        <footer className="pt-20 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ">
            PRIVACY OVERSIGHT OFFICE &bull; BDB-DATA-LEAD &bull; BD BLOOD
          </p>
          <div className="flex items-center gap-8">
            <Link
              href="/terms"
              className="text-[10px] font-black uppercase  hover:text-primary transition-colors flex items-center gap-2 group"
            >
              Terms of Service
              <ArrowRight className="size-3 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
            </Link>
            <Link
              href="/"
              className="text-[10px] font-black uppercase  hover:text-primary transition-colors flex items-center gap-2 group"
            >
              Home System
              <ArrowRight className="size-3 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PolicyPage;
