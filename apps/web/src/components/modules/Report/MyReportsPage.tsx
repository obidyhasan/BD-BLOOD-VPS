"use client";

import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SubmitReportDialog from "@/components/modules/Report/SubmitReportDialog";
import { Clock, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";
import { useGetMyReportsQuery } from "@/redux/features/reports/reportsApi";
import { formatDistanceToNow } from "date-fns";

const getStatusStyles = (status: string) => {
  if (status === "RESOLVED") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-none";
  if (status === "REJECTED") return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 shadow-none";
  return "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-none";
};

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

const MyReportsPage = () => {
  const { data, isLoading } = useGetMyReportsQuery();
  const reports = data?.data ?? [];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <DashboardHeader
          title="My Reports"
          subtitle="Track the reports you have submitted."
          badge="Integrity Hub"
        />
        <SubmitReportDialog />
      </div>

      {isLoading ? (
        <div className="grid gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 rounded-[2.5rem] bg-zinc-100 animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card className="rounded-[3rem] border-dashed border-border/40 p-16 text-center">
          <ShieldAlert className="size-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="font-black uppercase tracking-tighter text-muted-foreground">No reports yet</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {reports.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="rounded-[2.5rem] border-border/40 overflow-hidden shadow-none hover:shadow-premium transition-all">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge className={`rounded-full px-4 py-1.5 text-[9px] font-black uppercase  border ${getStatusStyles(report.status)}`}>
                          {statusLabel[report.status] ?? report.status}
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1 text-[9px] font-black uppercase">
                          {report.targetType}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-black tracking-tighter uppercase">
                        {report.reason.length > 80 ? `${report.reason.slice(0, 77)}...` : report.reason}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-xs font-bold">
                        <Clock className="size-3 opacity-40" />
                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                    {report.reason}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;
