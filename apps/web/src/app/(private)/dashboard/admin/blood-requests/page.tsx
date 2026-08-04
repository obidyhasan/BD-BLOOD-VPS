"use client";

import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { AdminBloodRequestsTable } from "@/components/modules/Organization/BloodRequest/AdminBloodRequestsTable";
import SmsReplyDialog from "@/components/modules/Organization/BloodRequest/SmsReplyDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Clock, CheckCircle2, AlertTriangle, Droplets } from "lucide-react";
import { motion } from "motion/react";
import { useGetAllBloodRequestsQuery } from "@/redux/features/bloodRequests/bloodRequestsApi";

export default function AdminBloodRequestsPage() {
  const { data, isLoading } = useGetAllBloodRequestsQuery({ limit: 500 });
  const requests = data?.data ?? [];

  const pendingRequests = requests.filter(
    (r) => r.status === "PENDING" || r.status === "PROCESSING"
  );
  const completedRequests = requests.filter(
    (r) => r.status === "FULFILLED" || r.status === "CANCELLED" || r.status === "REJECTED"
  );

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <DashboardHeader
          variant="clinical"
          title="Blood Requests"
          subtitle="Manage and track all urgent blood requests."
          badge="Global Authority"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <DashboardHeader
          variant="clinical"
          title="Blood Requests"
          subtitle="Manage and track all urgent blood requests across every organization."
          badge="Global Authority"
        />
        <div className="flex items-center gap-3">
          <SmsReplyDialog />
        </div>
      </div>

      {/* Overview Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Active Operations",
            val: pendingRequests.length,
            sub: "Pending or Processing",
            icon: AlertTriangle,
            color: "text-red-500",
            bg: "bg-red-500/10",
          },
          {
            label: "Resolved System-Wide",
            val: completedRequests.length,
            sub: "Fulfilled or Closed",
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Total Platform Requests",
            val: requests.length,
            sub: "System Lifetime",
            icon: Activity,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Network Response Time",
            val: "12m",
            sub: "Top Tier Performance",
            icon: Clock,
            color: "text-primary",
            bg: "bg-primary/10",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="rounded-[2.5rem] border-border/40 overflow-hidden shadow-none hover:shadow-premium transition-all duration-300 bg-card group h-full">
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`size-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <stat.icon className="size-6" />
                  </div>
                  <Droplets className="size-4 text-muted-foreground opacity-20" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground  opacity-60">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-black text-foreground tracking-tighter">
                    {stat.val}
                  </p>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground opacity-40 ">
                  {stat.sub}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {
        requests.length > 0 && (
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 md:gap-6">
                <AdminBloodRequestsTable data={requests} />
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
}