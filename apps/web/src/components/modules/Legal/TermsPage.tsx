"use client";

import Link from "next/link";
import {
  ShieldCheck,
  AlertCircle,
  Scale,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TermsPage = () => {
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
                Platform Governance
              </Badge>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-none  select-none">
                Terms{" "}
                <span className="text-primary font-normal not-">&</span>{" "}
                Protocol
              </h1>
              <div className="flex items-center gap-3 justify-center lg:justify-start text-[10px] font-black uppercase text-muted-foreground opacity-40  ">
                <Clock className="size-3" />
                Last Verified Revision: April 05, 2026
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-4 h-16 px-8 rounded-2xl bg-zinc-950 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-zinc-950/20 translate-y-2">
              BDB-LEGAL-V.01
            </div>
          </div>
        </header>

        {/* Content Ledger */}
        <section className="space-y-12">
          <div className="p-12 md:p-16 rounded-[4rem] bg-white dark:bg-zinc-900 border border-border/40 shadow-none border-dashed relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-all group-hover:bg-primary/10" />

            <div className="relative z-10 space-y-16">
              {/* Section 1 */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-[1.25rem] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-xs text-primary shadow-sm border border-border/40">
                    01
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3">
                    <ShieldCheck className="size-5 text-primary" />
                    Node Responsibility
                  </h3>
                </div>
                <p className="text-base md:text-lg font-medium text-muted-foreground leading-relaxed  border-l-4 border-primary/10 pl-8 ml-6">
                  &quot;Users must ensure the peak accuracy of informational
                  vectors across blood requests, donor portfolios, and
                  organizational hubs. Any signal detected as misleading,
                  harmful, or out-of-protocol will be immediately purged by the
                  regional moderation oversight.&quot;
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-[1.25rem] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-xs text-primary shadow-sm border border-border/40">
                    02
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3">
                    <Scale className="size-5 text-primary" />
                    Network Gateways
                  </h3>
                </div>
                <p className="text-base md:text-lg font-medium text-muted-foreground leading-relaxed  border-l-4 border-primary/10 pl-8 ml-6">
                  &quot;Emergency signal delivery (SMS/Notifications) is reliant
                  on the uptime of external telemetric gateways. BD BLOOD serves
                  as the central command facilitating these protocols but cannot
                  guarantee the atomic reliability of third-party regional
                  hubs.&quot;
                </p>
              </div>

              {/* Section 3 */}
              <div className="space-y-8 pt-8 border-t border-border/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-10 rounded-[3rem] bg-zinc-950 text-white  group/callout">
                  <div className="space-y-2">
                    <h4 className="text-xl font-black tracking-tighter uppercase flex items-center gap-3">
                      <AlertCircle className="size-5 text-primary shrink-0" />
                      Agreement Acknowledgement
                    </h4>
                    <p className="text-white/40 text-sm font-medium leading-relaxed max-w-md">
                      By continuing to operate within the BD BLOOD ecosystem,
                      you signify your absolute compliance with these
                      operational protocols.
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-4 h-16 px-8 rounded-2xl border border-white/10 hover:bg-white/5 transition-all text-[10px] font-black uppercase  cursor-pointer group-hover/callout:border-primary/40 group-hover/callout:text-primary">
                    Download PDF
                    <ExternalLink className="size-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Navigation */}
        <footer className="pt-20 border-t border-border/20 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ">
            BD BLOOD SYSTEMS &bull; LEGAL OVERSIGHT OFFICE &bull; BDB-LAW-HUB
          </p>
          <div className="flex items-center gap-8">
            <Link
              href="/privacy"
              className="text-[10px] font-black uppercase  hover:text-primary transition-colors flex items-center gap-2 group"
            >
              Privacy Policy
              <ArrowRight className="size-3 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
            </Link>
            <Link
              href="/"
              className="text-[10px] font-black uppercase  hover:text-primary transition-colors flex items-center gap-2 group"
            >
              Return Home
              <ArrowRight className="size-3 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TermsPage;
