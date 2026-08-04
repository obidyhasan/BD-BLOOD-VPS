"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ShieldCheck, MapPin, ArrowUpRight, Target } from "lucide-react";
import Link from "next/link";

interface OrganizationCardProps {
  orgId: string;
  name: string;
  location: string;
  members: string;
  logo?: string | null;
  type?: string | null;
}

export default function OrganizationCard({
  orgId,
  name,
  location,
  members,
  logo,
  type,
}: OrganizationCardProps) {
  return (
    <motion.div className="group relative bg-white dark:bg-zinc-900 rounded-[3rem] p-6 border border-border/40 shadow-premium overflow-hidden transition-all duration-500">
      {/* Decoration Blobs */}
      <div className="absolute top-0 right-0 size-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />

      <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-stretch relative z-10">
        {/* Image Block */}
        <div className="relative w-full lg:w-72 aspect-square lg:aspect-auto rounded-[2.5rem] overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0">
          {logo ? (
            <Image
              src={logo}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-1000"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 text-6xl font-black text-primary">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-4 right-4">
            <div className="size-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-xl">
              <ShieldCheck className="size-5" />
            </div>
          </div>
        </div>

        {/* Content Block */}
        <div className="flex-1 flex flex-col justify-between py-2 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase ">
              <div className="size-1.5 rounded-full bg-primary animate-pulse" />
              Verified Headquarters
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter uppercase leading-none">
                {name}
              </h3>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary" />
                  <span className="text-xs font-bold uppercase ">
                    {location}
                  </span>
                </div>
                <div className="size-1 rounded-full bg-border" />
                <div className="flex items-center gap-1.5">
                  <Target className="size-3.5 text-primary" />
                  <span className="text-xs font-bold uppercase ">
                    {type ?? "Organization"}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground font-medium text-sm leading-relaxed max-w-xl">
              This central coordinating hub facilitates critical blood
              requirements and regional social works across the sector.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-6 border-t border-border/40">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex size-10 items-center justify-center rounded-full border-2 border-white bg-primary/10 text-xs font-black text-primary dark:border-zinc-900"
                  >
                    {i}
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-foreground tracking-tighter leading-none">
                  {members}+
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase ">
                  Global Lives Saved
                </span>
              </div>
            </div>

            <Link
              href={`/organization/${orgId}`}
              className="w-full sm:w-auto ml-auto"
            >
              <button className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase  shadow-xl shadow-zinc-950/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                Visit Public Profile
                <ArrowUpRight className="size-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Link overlay for accessibility and ease of use */}
      <Link
        href={`/organization/${orgId}`}
        className="absolute inset-0 z-0 sm:hidden"
      >
        <span className="sr-only">Visit {name} Profile</span>
      </Link>
    </motion.div>
  );
}
