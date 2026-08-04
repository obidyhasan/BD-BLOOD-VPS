"use client";

import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Clock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useGetAllReportsQuery,
  useUpdateReportStatusMutation,
} from "@/redux/features/reports/reportsApi";
import { formatDistanceToNow } from "date-fns";
import { extractErrorMessage } from "@/lib/apiError";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const getStatusStyles = (status: string) => {
  if (status === "RESOLVED")
    return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  if (status === "REJECTED")
    return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
  return "bg-amber-500/10 text-amber-500 border-amber-500/20";
};

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

const AdminReportsPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data, isLoading } = useGetAllReportsQuery(
    statusFilter !== "all" ? { status: statusFilter, limit: 50 } : { limit: 50 },
  );
  const [updateStatus, { isLoading: updating }] =
    useUpdateReportStatusMutation();

  const reports = data?.data ?? [];

  const handleStatusChange = async (
    id: string,
    status: "PENDING" | "RESOLVED" | "REJECTED",
  ) => {
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success(`Report marked as ${statusLabel[status]}`);
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, "Failed to update report status"));
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <DashboardHeader
          title="Reports"
          subtitle="Review and resolve reports submitted by users."
          badge="Trust & Safety"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 h-12 rounded-xl font-bold">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reports</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-[2.5rem] bg-zinc-100 animate-pulse"
            />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card className="rounded-[3rem] border-dashed border-border/40 p-16 text-center">
          <ShieldAlert className="size-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="font-black uppercase tracking-tighter text-muted-foreground">
            No reports found
          </p>
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
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge
                          className={`rounded-full px-4 py-1.5 text-[9px] font-black uppercase  border ${getStatusStyles(report.status)}`}
                        >
                          {statusLabel[report.status] ?? report.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-full px-3 py-1 text-[9px] font-black uppercase"
                        >
                          {report.targetType}
                        </Badge>
                        {report.reporter && (
                          <span className="text-[10px] font-bold text-muted-foreground">
                            by {report.reporter.fullName}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-lg font-black tracking-tighter uppercase">
                        Target: {report.targetId}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-xs font-bold">
                        <Clock className="size-3 opacity-40" />
                        {formatDistanceToNow(new Date(report.createdAt), {
                          addSuffix: true,
                        })}
                      </CardDescription>
                    </div>
                    {report.status === "PENDING" && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="rounded-xl font-black text-[10px] uppercase "
                          disabled={updating}
                          onClick={() =>
                            void handleStatusChange(report.id, "RESOLVED")
                          }
                        >
                          <CheckCircle2 className="size-3.5 mr-1.5" />
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl font-black text-[10px] uppercase "
                          disabled={updating}
                          onClick={() =>
                            void handleStatusChange(report.id, "REJECTED")
                          }
                        >
                          <XCircle className="size-3.5 mr-1.5" />
                          Reject
                        </Button>
                      </div>
                    )}
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

export default AdminReportsPage;
