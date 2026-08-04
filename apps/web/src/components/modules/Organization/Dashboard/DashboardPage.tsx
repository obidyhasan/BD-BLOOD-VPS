"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { SectionCards } from "@/components/section-cards";
import { DataTable } from "@/components/data-table";
import { motion } from "motion/react";
import { ShieldCheck, Globe, HeartPulse, ArrowUpRight, ShieldAlert, Users, Loader2 } from "lucide-react";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { cn } from "@/lib/utils";
import {
  useGetOrganizationStatsQuery,
} from "@/redux/features/analytics/analyticsApi";
import { useOrganizationDashboardContext } from "@/hooks/useOrganizationDashboardContext";
import { useGetAllBloodRequestsQuery } from "@/redux/features/bloodRequests/bloodRequestsApi";
import type { z } from "zod";
import type { schema } from "@/components/data-table";

// See admin dashboard page for the same treatment — recharts is a
// substantial dependency, deferred out of this route's initial bundle.
const ChartAreaInteractive = dynamic(
  () =>
    import("@/components/chart-area-interactive").then(
      (mod) => mod.ChartAreaInteractive,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[350px] w-full animate-pulse rounded-3xl bg-muted/50" />
    ),
  },
);

const statusLabel: Record<string, string> = {
  PENDING: "In Process",
  PROCESSING: "In Process",
  FULFILLED: "Done",
  CANCELLED: "Closed",
  REJECTED: "Closed",
};

export default function DashboardPage() {
  const { isAdmin, organizationId: orgId, organization } =
    useOrganizationDashboardContext();
  const { data: statsData } = useGetOrganizationStatsQuery(
    orgId ? { organizationId: orgId } : undefined,
    { skip: !orgId },
  );
  const { data: requestsData, isLoading: requestsLoading } =
    useGetAllBloodRequestsQuery(
      orgId
        ? { limit: 30, sortOrder: "desc", organizationId: orgId }
        : { limit: 30, sortOrder: "desc" },
      { skip: !orgId && !isAdmin },
    );

  const org = organization;
  const stats = statsData?.data;

  const tableData: z.infer<typeof schema>[] = useMemo(() => {
    return (requestsData?.data ?? []).map((r, index) => ({
      id: index + 1,
      header: `${r.bloodGroup?.groupName ?? "—"} — ${r.hospitalName}`,
      type: r.requestType === "URGENT" ? "Urgent" : "General",
      status: statusLabel[r.status] ?? "In Process",
      target: `${r.requiredUnits} unit${r.requiredUnits > 1 ? "s" : ""}`,
      limit: r.message?.slice(0, 48) ?? "—",
      reviewer: r.requesterName,
    }));
  }, [requestsData]);

  const profileItems = [
    {
      label: "Primary Sector",
      val: org?.district?.name ?? org?.address ?? "—",
      icon: Globe,
      color: "text-primary",
    },
    {
      label: "Member Registry",
      val: `${stats?.members ?? 0} Active`,
      icon: Users,
      color: "text-emerald-500",
    },
    {
      label: "Pending Requests",
      val: String(stats?.pendingRequests ?? 0),
      icon: HeartPulse,
      color: "text-red-500",
    },
    {
      label: "Inventory Units",
      val: String(stats?.inventoryUnits ?? 0),
      icon: ShieldAlert,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="flex flex-1 flex-col bg-zinc-50/50 dark:bg-zinc-950/30">
      <div className="@container/main flex flex-1 flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
          <DashboardHeader
            variant="clinical"
            title="Overview"
            subtitle="A live overview of your organization's blood supply and activity."
            className="px-2 mb-0"
          />
        </div>

        <div className="grid grid-cols-1 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SectionCards />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-8 rounded-[3.5rem] bg-white dark:bg-zinc-900 border border-border/50 shadow-premium"
            >
              <ChartAreaInteractive />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-4 p-10 rounded-[3.5rem] bg-zinc-950 text-white relative overflow-hidden group shadow-2xl"
            >
              <div className="absolute -bottom-10 -right-10 size-64 bg-primary/20 rounded-full blur-[100px] opacity-20 transition-transform duration-1000 group-hover:scale-110" />
              <div className="relative z-10 space-y-10">
                <div className="space-y-4">
                  <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center text-primary border border-white/10 mb-2">
                    <ShieldCheck className="size-6 shadow-sm" />
                  </div>
                  <h3 className="text-3xl font-black leading-none uppercase tracking-tighter">
                    {org?.name ?? "Organization"}
                  </h3>
                  <p className="text-[10px] font-black uppercase text-white/30  leading-relaxed">
                    {org?.type ?? "Regional Branch"} • {org?.upazila?.name ?? ""}
                  </p>
                </div>

                <div className="space-y-6">
                  {profileItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between border-b border-white/5 pb-4 last:border-none"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "size-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5",
                            item.color,
                          )}
                        >
                          <item.icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase text-white/20 mb-0.5">
                            {item.label}
                          </p>
                          <p className="text-sm font-black">{item.val}</p>
                        </div>
                      </div>
                      <ArrowUpRight className="size-3 text-primary group-hover:text-primary transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-10 rounded-[3.5rem] bg-white dark:bg-zinc-900 border border-border/50 shadow-premium"
          >
            {requestsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : (
              <DataTable data={tableData} />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}



