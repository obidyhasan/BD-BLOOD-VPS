"use client";

import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Phone,
  Droplets,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useGetOrganizationMembersQuery } from "@/redux/features/organizations/organizationsApi";
import Link from "next/link";
import type { DonorCardModel } from "./donorTypes";
import { useOrganizationDashboardContext } from "@/hooks/useOrganizationDashboardContext";

type DonorCardProps = {
  donor: DonorCardModel;
  index?: number;
};

const DonorCard = ({ donor, index = 0 }: DonorCardProps) => {
  const { organizationId: orgId } = useOrganizationDashboardContext();
  const { data: membersData } = useGetOrganizationMembersQuery(orgId ?? "", {
    skip: !orgId,
  });
  const isMember = (membersData?.data ?? []).some(
    (m) => m.donorId === donor.id && m.status === "ACTIVE",
  );

  const initials = donor.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.04 }}
        whileHover={{ y: -6, scale: 1.01 }}
      >
        <Link
          href={`/donor/${donor.id}`}
          className="group relative cursor-pointer block h-full"
        >
          <div className="p-6 rounded-[2.5rem] border border-border/40 bg-white dark:bg-zinc-900 transition-all duration-500 hover:shadow-premium hover:border-primary/30 relative overflow-hidden h-full flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" />

            <div className="space-y-2 relative z-10">
              <div className="flex gap-4 items-start justify-between">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="size-20 rounded-3xl overflow-hidden border-2 border-background shadow-xl group-hover:rotate-3 transition-transform duration-500 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <span className="text-2xl font-black text-muted-foreground">
                      {initials}
                    </span>
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 size-6 rounded-full ${donor.available ? "bg-emerald-500" : "bg-zinc-400"} border-4 border-white dark:border-zinc-950 shadow-lg flex items-center justify-center`}
                  >
                    {donor.available ? (
                      <ShieldCheck className="size-3 text-white" />
                    ) : (
                      <XCircle className="size-3 text-white" />
                    )}
                  </div>
                </div>

                {/* Blood Type Badge */}
                <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-zinc-50 dark:bg-zinc-950 border border-border/40 group-hover:border-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 min-w-[70px]">
                  <Droplets className="size-4 mb-1 fill-current opacity-60" />
                  <span className="text-2xl font-black leading-none tracking-tighter ">
                    {donor.bloodGroup}
                  </span>
                  <span className="text-[10px] font-black uppercase opacity-40 mt-1">
                    {donor.available ? "Ready" : "Busy"}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-1">
                <h3 className="font-black text-xl text-foreground tracking-tighter uppercase group-hover:text-primary transition-colors flex items-center gap-2">
                  {donor.name}
                  {isMember && (
                    <Badge className="rounded-full bg-emerald-500/10 text-emerald-500 border-emerald-500/10 font-black text-[8px] uppercase  px-2 py-0">
                      Member
                    </Badge>
                  )}
                </h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">
                  {donor.accountStatus === "active"
                    ? donor.available
                      ? "Available"
                      : "In Recovery"
                    : "Account Inactive"}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-muted-foreground/80">
                  <div className="size-8 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-border/40 flex items-center justify-center">
                    <Phone className="size-3.5 text-primary/60" />
                  </div>
                  <span className="text-xs font-black tracking-tight">
                    {donor.phone}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground/80">
                  <div className="size-8 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-border/40 flex items-center justify-center">
                    <MapPin className="size-3.5 text-primary/60" />
                  </div>
                  <span className="text-xs font-black tracking-tight">
                    {donor.district}, BD
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-border/40 flex items-center justify-between relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-muted-foreground opacity-40">
                  Last Donation
                </span>
                <span className="text-xs font-black ">
                  {donor.lastDonationDate
                    ? new Date(donor.lastDonationDate).toLocaleDateString(
                      "en-GB",
                      { day: "2-digit", month: "short", year: "numeric" },
                    )
                    : "—"}
                </span>
              </div>
              <Button
                asChild
                className="h-12 w-12 rounded-2xl bg-primary hover:bg-primary/80 text-white font-black uppercase  text-[11px] shadow-xl shadow-zinc-950/20 group"
                onClick={(e) => e.stopPropagation()}
              >
                <a href={`tel:${donor.phone}`}>
                  <Phone className="size-4" />
                </a>
              </Button>
            </div>
          </div>
        </Link>
      </motion.div>
    </>
  );
};

export default DonorCard;
