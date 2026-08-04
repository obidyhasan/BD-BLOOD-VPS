"use client";

import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import { toast } from "sonner";
import {
  ShieldAlert,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  MessageSquare,
  Newspaper,
  AlertTriangle,
  ShieldCheck,
  Eye,
  CheckCircle2,
  XCircle,
  Activity,
  Info,
} from "lucide-react";
import { motion } from "motion/react";
import { useState, useMemo } from "react";
import {
  useGetAllReportsQuery,
  useUpdateReportStatusMutation,
  useDeleteReportMutation,
} from "@/redux/features/reports/reportsApi";
import {
  mapReportToModerationAsset,
  mapModerationStatusToApi,
  type ModerationAssetUI,
} from "@/lib/report";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const getStatusStyles = (status: string) => {
  if (status === "Accepted")
    return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-none";
  if (status === "Rejected")
    return "bg-red-500/10 text-red-500 border-red-500/20 shadow-none";
  if (status === "In Review")
    return "bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-none";
  return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 shadow-none";
};

const getSeverityStyles = (severity: string) => {
  if (severity === "HIGH") return "text-red-500 bg-red-500/5 border-red-500/20";
  if (severity === "MEDIUM")
    return "text-amber-500 bg-amber-500/5 border-amber-500/20";
  return "text-blue-500 bg-blue-500/5 border-blue-500/20";
};

const getTypeIcon = (type: string) => {
  if (type === "POST") return <Newspaper className="size-4" />;
  if (type === "BIO") return <User className="size-4" />;
  return <MessageSquare className="size-4" />;
};

const DonorQueryPage = () => {
  const { data: reportsData } = useGetAllReportsQuery({ limit: 100 });
  const [updateReportStatus] = useUpdateReportStatusMutation();
  const [deleteReport] = useDeleteReportMutation();

  const data: ModerationAssetUI[] = useMemo(
    () => (reportsData?.data ?? []).map(mapReportToModerationAsset),
    [reportsData],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [selectedAsset, setSelectedAsset] = useState<ModerationAssetUI | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handleAction = async (id: string, status: "Accepted" | "Rejected") => {
    try {
      await updateReportStatus({
        id,
        status: mapModerationStatusToApi(status),
      }).unwrap();
      toast.success(`Entry marked as ${status.toLowerCase()}`);
      setIsModalOpen(false);
    } catch {
      toast.error("Failed to update report");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await deleteReport(id).unwrap();
      toast.error(`Entry deleted from records`);
    } catch {
      toast.error("Failed to delete report");
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const authorMatch = item.author
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const issueMatch = item.issue
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesSearch = authorMatch || issueMatch;

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      const matchesType = typeFilter === "All" || item.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [data, searchQuery, statusFilter, typeFilter]);

  const columns: ColumnDef<ModerationAssetUI>[] = [
    {
      accessorKey: "author",
      header: "Sent By",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
            {getTypeIcon(row.original.type)}
          </div>
          <div className="space-y-0.5">
            <p className="font-black text-xs uppercase tracking-tighter text-foreground">
              {row.original.author}
            </p>
            <p className="text-[9px] font-black uppercase text-muted-foreground opacity-40">
              {row.original.type}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "issue",
      header: "Issue Details",
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="font-bold text-sm text-foreground opacity-80 flex items-center gap-2">
            <span className="text-red-500 font-black">!</span>
            {row.original.issue}
          </p>
          <div className="text-[9px] font-black uppercase text-muted-foreground opacity-40 flex items-center gap-1">
            <Clock className="size-2.5" />
            Reported {row.original.time}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "severity",
      header: "Risk Level",
      cell: ({ row }) => (
        <Badge
          className={cn(
            "rounded-lg px-2 py-0.5 text-[8px] font-black uppercase  border shadow-none",
            getSeverityStyles(row.original.severity),
          )}
        >
          {row.original.severity}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge
            className={cn(
              "rounded-full px-4 py-1 text-[9px] font-black uppercase  border shadow-none",
              getStatusStyles(row.original.status),
            )}
          >
            {row.original.status}
          </Badge>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right px-4">Actions</div>,
      cell: ({ row }) => {
        const item = row.original;

        return (
          <div className="flex items-center justify-end gap-2 px-4">
            {item.status === "In Review" ? (
              <Button
                size="sm"
                onClick={() => {
                  setSelectedAsset(item);
                  setIsModalOpen(true);
                }}
                className="h-9 rounded-xl px-5 bg-primary dark:bg-white dark:text-zinc-950 text-white font-black text-[9px] uppercase  hover:scale-105 transition-all shadow-none"
              >
                Verify
              </Button>
            ) : (
              <div className="h-9 flex items-center px-4 font-black text-[9px] uppercase  text-muted-foreground  opacity-40">
                {item.status}
              </div>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setAssetToDelete(item.id);
                setIsAlertOpen(true);
              }}
              className="size-9 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-all shadow-none"
            >
              <XCircle className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 6 } },
  });

  const activeFlags = data.filter((r) => r.status === "In Review").length;
  const highPriority = data.filter(
    (r) => r.severity === "HIGH" && r.status === "In Review",
  ).length;
  const acceptedCount = data.filter((r) => r.status === "Accepted").length;
  const rejectedCount = data.filter((r) => r.status === "Rejected").length;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <DashboardHeader
          variant="clinical"
          title="Donor Queue"
          subtitle="Review new accounts, reported issues, and pending checks."
        />
      </div>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "New Issues",
            val: activeFlags,
            icon: ShieldAlert,
            color: "text-amber-500",
            bg: "bg-amber-500/5",
          },
          {
            label: "Urgent",
            val: highPriority,
            icon: AlertTriangle,
            color: "text-red-500",
            bg: "bg-red-500/5",
          },
          {
            label: "Verified",
            val: acceptedCount,
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-500/5",
          },
          {
            label: "Declined",
            val: rejectedCount,
            icon: XCircle,
            color: "text-zinc-500",
            bg: "bg-zinc-500/5",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="rounded-[3rem] border-border/40 overflow-hidden bg-card border-dashed p-8 space-y-6 hover:shadow-premium transition-all duration-500 group relative">
              <div
                className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full blur-3xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity`}
              />

              <div className="flex items-center justify-between relative z-10">
                <div
                  className={`size-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110`}
                >
                  <stat.icon className="size-7" />
                </div>
                <Activity className="size-4 text-muted-foreground/20 group-hover:text-primary/40 transition-colors" />
              </div>
              <div className="space-y-1 relative z-10">
                <p
                  className={cn(
                    "text-5xl font-black tracking-tighter tabular-nums leading-none",
                    stat.color,
                  )}
                >
                  {stat.val}
                </p>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] opacity-40">
                  {stat.label}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-full sm:min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search the list..."
            className="h-14 pl-12 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border-border/40 focus-visible:ring-2 focus-visible:ring-primary/20 font-bold border shadow-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border rounded-2xl py-7 w-[160px] dark:bg-zinc-950/50 font-black text-xs uppercase px-6 shadow-none">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40 shadow-premium">
              <SelectItem
                value="All"
                className="font-bold rounded-lg my-1 text-xs"
              >
                All Status
              </SelectItem>
              <SelectItem
                value="In Review"
                className="font-bold rounded-lg my-1 text-xs"
              >
                Reviewing
              </SelectItem>
              <SelectItem
                value="Accepted"
                className="font-bold rounded-lg my-1 text-xs"
              >
                Verified
              </SelectItem>
              <SelectItem
                value="Rejected"
                className="font-bold rounded-lg my-1 text-xs text-red-500"
              >
                Declined
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="border rounded-2xl py-7 w-[200px] dark:bg-zinc-950/50 font-black text-xs uppercase px-6 shadow-none">
              <SelectValue placeholder="Component" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40 shadow-premium">
              <SelectItem
                value="All"
                className="font-bold rounded-lg my-1 text-xs px-4"
              >
                All Type
              </SelectItem>
              {["POST", "BIO", "COMMENT"].map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                  className="font-bold rounded-lg my-1 text-xs px-4 uppercase"
                >
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <section className="space-y-6">
        <Card className="rounded-[3rem] border-border/40 overflow-hidden shadow-none bg-card border-dashed">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-border/40 h-20">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="hover:bg-transparent border-none"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="px-8 font-black uppercase text-[10px]  text-muted-foreground text-left first:px-8 last:px-8"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="h-24 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-all border-b border-border/20 last:border-none group"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-8 last:px-8">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-32 text-center text-muted-foreground font-black uppercase text-xs opacity-40"
                    >
                      The list is empty.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination Info */}
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()} · {filteredData.length} records
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase shadow-none"
            >
              <ChevronLeft className="size-4 mr-1" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase shadow-none"
            >
              Next
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Verification Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl rounded-[3rem] border-dashed border-border/40 bg-card p-8 shadow-premium overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none opacity-50" />

          <DialogHeader className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-primary border border-border/40 ">
                {selectedAsset && getTypeIcon(selectedAsset.type)}
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-black tracking-tighter uppercase tabular-nums">
                  Query Details
                </DialogTitle>
                <DialogDescription className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <Clock className="size-3" />
                  Reported {selectedAsset?.time}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40 flex items-center gap-2">
                  Reported By
                </p>
                <p className="font-black text-sm uppercase tracking-tighter text-foreground">
                  {selectedAsset?.author}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40 flex items-center gap-2">
                  Type of Query
                </p>
                <Badge
                  className={cn(
                    "rounded-lg px-3 py-1 text-[10px] font-black uppercase  border",
                    selectedAsset && getSeverityStyles(selectedAsset.severity),
                  )}
                >
                  {selectedAsset?.severity} Level Threat
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40 flex items-center gap-2">
                Query Details
              </p>
              <div className="p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-950 border border-border/40 border-dashed">
                <p className="text-sm font-bold text-foreground leading-relaxed">
                  {selectedAsset?.issue}:{" "}
                  <span className="opacity-60 ">
                    &quot;{selectedAsset?.content}&quot;
                  </span>
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border/20 border-dashed">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-2xl border-2 border-red-500/20 text-red-500 font-black uppercase tracking-[0.2em] text-xs hover:bg-red-500/5 hover:border-red-500 hover:scale-[1.02] transition-all"
              onClick={() =>
                selectedAsset && handleAction(selectedAsset.id, "Rejected")
              }
            >
              <XCircle className="size-4 mr-2" />
              Decline
            </Button>
            <Button
              className="flex-1 h-12 rounded-2xl bg-primary dark:bg-white dark:text-zinc-950 text-white font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-zinc-950/20"
              onClick={() =>
                selectedAsset && handleAction(selectedAsset.id, "Accepted")
              }
            >
              <CheckCircle2 className="size-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deletion Alert */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-dashed border-border/40 p-10 bg-card">
          <AlertDialogHeader className="space-y-4">
            <div className="size-16 rounded-2xl bg-red-500/5 text-red-500 flex items-center justify-center border border-red-500/10 mb-2">
              <AlertTriangle className="size-8" />
            </div>
            <AlertDialogTitle className="text-2xl font-black tracking-tighter uppercase tabular-nums">
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-bold text-muted-foreground leading-relaxed">
              Are you sure you want to remove this record from the queue? This
              action is permanent and cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3 pt-6">
            <AlertDialogCancel className="h-12 rounded-xl font-black uppercase text-[10px]  border-2">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => assetToDelete && handleRemove(assetToDelete)}
              className="h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black uppercase text-[10px]  shadow-xl shadow-red-500/20"
            >
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DonorQueryPage;
