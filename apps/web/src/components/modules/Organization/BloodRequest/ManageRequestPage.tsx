"use client";

import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { AdminBloodRequestsTable } from "./AdminBloodRequestsTable";
import SmsReplyDialog from "./SmsReplyDialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Droplets,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { useGetAllBloodRequestsQuery } from "@/redux/features/bloodRequests/bloodRequestsApi";

const ManageRequestPage = () => {
  const { data, isLoading } = useGetAllBloodRequestsQuery({ limit: 500 });
  const apiRows = data?.data ?? [];

  const activeRequests = apiRows.filter((request) =>
    ["SUBMITTED", "PROCESSING", "DONOR_FOUND", "FULFILLED"].includes(
      request.status,
    ),
  );
  const totalRequests = apiRows.length;
  const completedRequests = apiRows.filter((request) =>
    ["COMPLETED", "CANCELLED", "REJECTED"].includes(request.status),
  ).length;

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <DashboardHeader
          variant="clinical"
          title="Manage Requests"
          subtitle="Manage and track urgent blood requests in real time."
          badge="Administrative Control"
        />
        <div className="flex items-center">
          <SmsReplyDialog />
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {[
          {
            label: "Active Operations",
            val: activeRequests.length,
            sub: "Requires Immediate Action",
            icon: AlertTriangle,
            color: "text-red-500",
            bg: "bg-red-500/10",
          },
          {
            label: "Resolved",
            val: completedRequests,
            sub: "Closed Requests",
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Total Requests",
            val: totalRequests,
            sub: "System Lifetime",
            icon: Activity,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Urgent Queue",
            val: apiRows.filter((r) => r.requestType === "URGENT").length,
            sub: "Priority Cases",
            icon: Clock,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Donor Found",
            val: apiRows.filter((request) => request.status === "DONOR_FOUND").length,
            sub: "All bags committed",
            icon: Droplets,
            color: "text-violet-500",
            bg: "bg-violet-500/10",
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

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 md:gap-6 ">
            <AdminBloodRequestsTable data={apiRows} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageRequestPage;
