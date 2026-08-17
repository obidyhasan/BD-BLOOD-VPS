"use client";

import { extractErrorMessage } from "@/lib/apiError";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { formatDistanceToNowStrict } from "date-fns";
import { Loader2, RefreshCw, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
  BloodRequest,
  EligibleDonor,
  useAssignDonorsToRequestMutation,
  useCancelBloodRequestCommandMutation,
  useCompleteHandoverMutation,
  useGetEligibleDonorsQuery,
  useRejectBloodRequestMutation,
  useStartProcessingMutation,
} from "@/redux/features/bloodRequests/bloodRequestsApi";

const STATUS_FILTER_OPTIONS: BloodRequest["status"][] = [
  "SUBMITTED",
  "PROCESSING",
  "DONOR_FOUND",
  "FULFILLED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
];

function statusBadge(status: BloodRequest["status"]) {
  switch (status) {
    case "PENDING":
    case "SUBMITTED":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "PROCESSING":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "DONOR_FOUND":
      return "bg-violet-500/10 text-violet-600 border-violet-500/20";
    case "FULFILLED":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "COMPLETED":
      return "bg-teal-500/10 text-teal-700 border-teal-500/20";
    case "CANCELLED":
      return "bg-zinc-500/10 text-zinc-600 border-zinc-500/20";
    case "REJECTED":
      return "bg-red-500/10 text-red-600 border-red-500/20";
  }
}

function addressOf(row: BloodRequest | EligibleDonor) {
  return [row.upazila?.name, row.district?.name, row.division?.name]
    .filter(Boolean)
    .join(", ");
}

function summaryOf(request: BloodRequest) {
  return (
    request.assignmentSummary ?? {
      requiredBags: request.requiredUnits,
      committedBags: 0,
      fulfilledBags: 0,
      remainingCommitmentBags: request.requiredUnits,
      remainingFulfillmentBags: request.requiredUnits,
      notifiedDonors: 0,
      acceptedDonors: 0,
      pendingDonations: 0,
      donatedDonors: 0,
      inactiveAssignments: 0,
    }
  );
}

function NotifyDonorDialog({
  request,
  open,
  onOpenChange,
}: {
  request: BloodRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isFetching, isError, refetch } = useGetEligibleDonorsQuery(
    request?.id ?? "",
    { skip: !request?.id || !open },
  );
  const [assignDonors, { isLoading: assigning }] =
    useAssignDonorsToRequestMutation();

  const donors = data?.data?.donors ?? [];
  const summary = request ? summaryOf(request) : null;
  const remainingNeeded = summary?.remainingCommitmentBags ?? 0;

  const submit = async () => {
    if (!request) return;
    try {
      await assignDonors({ id: request.id }).unwrap();
      toast.success("Eligible donors notified.");
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(extractErrorMessage(e, "Failed to notify donors"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl rounded-2xl border-border/40 p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-border/40">
          <DialogTitle className="text-xl font-black tracking-tight">
            Notify Eligible Donors
          </DialogTitle>
          <DialogDescription>
            All eligible donors matching this request will receive the same
            Accept / Reject notification. Fulfillment is limited server-side by
            required bags.
          </DialogDescription>
        </DialogHeader>

        {request && summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-6 border-b border-border/30 bg-zinc-50/60 dark:bg-zinc-900/40">
            <Metric label="Required Bags" value={summary.requiredBags} />
            <Metric label="Eligible Donors" value={donors.length} />
            <Metric label="Already Notified" value={summary.notifiedDonors} />
            <Metric
              label="Remaining Commitments"
              value={remainingNeeded}
              tone={remainingNeeded === 0 ? "good" : "warn"}
            />
          </div>
        )}

        <div className="p-6">
          {isFetching ? (
            <div className="h-72 flex items-center justify-center gap-3 text-sm font-bold text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Fetching eligible donors...
            </div>
          ) : isError ? (
            <div className="h-72 flex flex-col items-center justify-center gap-4 text-center">
              <p className="text-sm font-bold text-muted-foreground">
                Could not load eligible donors.
              </p>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="rounded-xl font-bold"
              >
                <RefreshCw className="size-4 mr-2" /> Retry
              </Button>
            </div>
          ) : donors.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-sm font-bold text-muted-foreground">
              No eligible donors found for this request.
            </div>
          ) : (
            <ScrollArea className="h-[420px] pr-3">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12" />
                    <TableHead>Donor Name</TableHead>
                    <TableHead>Blood Group</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Availability</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donors.map((donor) => (
                    <TableRow key={donor.id} className="bg-emerald-500/5">
                      <TableCell>
                        <Checkbox
                          checked={false}
                          disabled
                          aria-label="Eligible donor will be notified"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-xs font-black uppercase">
                            {donor.fullName}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-black rounded-full"
                          >
                            {donor.matchLevel}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-red-500/10 text-red-600 border-red-500/20 font-black">
                          {donor.bloodGroup?.groupName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-muted-foreground">
                        {donor.phone ?? "No phone"}
                      </TableCell>
                      <TableCell className="text-xs font-bold">
                        {donor.organization?.organization?.name ?? "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[240px]">
                        {addressOf(donor) || "Address not set"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black"
                        >
                          {donor.availabilityStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="p-6 border-t border-border/40">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-black"
          >
            Close
          </Button>
          <Button
            onClick={submit}
            disabled={assigning || donors.length === 0}
            className="rounded-xl font-black"
          >
            {assigning && <Loader2 className="size-4 mr-2 animate-spin" />}
            Notify All Eligible
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "good" | "warn";
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background px-4 py-3">
      <p className="text-[9px] font-black uppercase  text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "text-2xl font-black",
          tone === "good" && "text-emerald-600",
          tone === "warn" && "text-amber-600",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function AdminBloodRequestsTable({ data }: { data: BloodRequest[] }) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    BloodRequest["status"] | "ALL"
  >("ALL");
  const [rematchRequest, setNotifyRequest] =
    React.useState<BloodRequest | null>(null);

  const [startProcessing, { isLoading: isStarting }] =
    useStartProcessingMutation();
  const [rejectRequest, { isLoading: isRejecting }] =
    useRejectBloodRequestMutation();
  const [cancelRequest, { isLoading: isCancelling }] =
    useCancelBloodRequestCommandMutation();
  const [completeHandover, { isLoading: isCompleting }] =
    useCompleteHandoverMutation();

  const filtered = React.useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    return data.filter((r) => {
      const matchesSearch =
        !s ||
        r.requesterName.toLowerCase().includes(s) ||
        r.requesterPhone?.includes(s) ||
        r.hospitalName.toLowerCase().includes(s) ||
        r.organization?.name?.toLowerCase().includes(s) ||
        r.bloodGroup?.groupName?.toLowerCase().includes(s);

      const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, searchTerm, statusFilter]);

  const columns = React.useMemo<ColumnDef<BloodRequest>[]>(
    () => [
      {
        id: "requestInfo",
        header: "Request Information",
        cell: ({ row }) => (
          <div className="space-y-1 min-w-[180px]">
            <p className="font-black text-xs uppercase tracking-tight">
              {row.original.hospitalName}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase ">
              {formatDistanceToNowStrict(new Date(row.original.createdAt), {
                addSuffix: true,
              })}
            </p>
            <Badge variant="outline" className="text-[9px] font-black w-fit">
              {row.original.requestType}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: "bloodGroup",
        header: "Blood Group",
        cell: ({ row }) => (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20 rounded-lg px-3 py-1 font-black text-[10px]  w-fit">
            {row.original.bloodGroup?.groupName ?? "-"}
          </Badge>
        ),
      },
      {
        accessorKey: "requiredUnits",
        header: "Required Bags",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-tighter">
              {row.original.requiredUnits}
            </span>
            <span className="text-[8px] font-black uppercase text-muted-foreground opacity-40 ">
              Bags
            </span>
          </div>
        ),
      },
      {
        id: "patient",
        header: "Patient Information",
        cell: ({ row }) => (
          <div className="space-y-1 min-w-[150px]">
            <p className="font-black text-xs uppercase tracking-tight">
              {row.original.requesterName}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground">
              {row.original.requesterPhone}
            </p>
          </div>
        ),
      },
      {
        id: "address",
        header: "Address Information",
        cell: ({ row }) => (
          <span className="text-xs font-bold text-muted-foreground max-w-[220px] block">
            {addressOf(row.original) || "-"}
          </span>
        ),
      },
      {
        id: "organization",
        header: "Organization Information",
        cell: ({ row }) => (
          <span className="text-xs font-bold text-foreground/70 max-w-[180px] block">
            {row.original.organization?.name ?? "Matched by notification"}
          </span>
        ),
      },
      {
        id: "fulfillment",
        header: "Bag Progress",
        cell: ({ row }) => {
          const s = summaryOf(row.original);
          return (
            <div className="grid grid-cols-2 gap-1 min-w-[170px] text-[9px] font-black uppercase">
              <span className="text-blue-600">Committed: {s.committedBags}/{s.requiredBags}</span>
              <span className="text-emerald-600">Verified: {s.fulfilledBags}/{s.requiredBags}</span>
              <span className="text-amber-600">Need donors: {s.remainingCommitmentBags}</span>
              <span className="text-violet-600">Need blood: {s.remainingFulfillmentBags}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "rounded-full px-3 py-1 font-black text-[9px] uppercase ",
              statusBadge(row.original.status),
            )}
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const r = row.original;
          const busy = isStarting || isRejecting || isCancelling || isCompleting;
          const terminal = ["COMPLETED", "CANCELLED", "REJECTED"].includes(r.status);
          return (
            <div className="flex items-center justify-end gap-2">
              {r.status === "SUBMITTED" && (
                <Button
                  size="sm"
                  className="h-10 rounded-xl font-black text-[9px] uppercase"
                  disabled={busy}
                  onClick={async () => {
                    try {
                      await startProcessing(r.id).unwrap();
                      toast.success("Processing started");
                    } catch (e: unknown) {
                      toast.error(extractErrorMessage(e, "Failed to start processing"));
                    }
                  }}
                >
                  Start
                </Button>
              )}

              {r.status === "PROCESSING" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 rounded-xl font-black text-[9px] uppercase border-dashed"
                  disabled={busy || summaryOf(r).remainingCommitmentBags <= 0}
                  onClick={() => setNotifyRequest(r)}
                >
                  <RefreshCw className="size-3 mr-1" />
                  Notify
                </Button>
              )}

              {r.status === "FULFILLED" && (
                <Button
                  size="sm"
                  className="h-10 rounded-xl font-black text-[9px] uppercase bg-emerald-600 hover:bg-emerald-700"
                  disabled={busy}
                  onClick={async () => {
                    try {
                      await completeHandover(r.id).unwrap();
                      toast.success("Hand-over completed");
                    } catch (e: unknown) {
                      toast.error(extractErrorMessage(e, "Failed to complete hand-over"));
                    }
                  }}
                >
                  Complete
                </Button>
              )}

              {r.status === "SUBMITTED" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 rounded-xl font-black text-[9px] uppercase border-red-500/30 text-red-600"
                  disabled={busy}
                  onClick={async () => {
                    try {
                      await rejectRequest({ id: r.id, reason: "Rejected by request manager" }).unwrap();
                      toast.success("Request rejected");
                    } catch (e: unknown) {
                      toast.error(extractErrorMessage(e, "Failed to reject request"));
                    }
                  }}
                >
                  Reject
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 rounded-xl font-black text-[9px] uppercase  border-dashed border-red-500/30 text-red-600 bg-red-500/5 hover:bg-red-500/10"
                    disabled={
                      busy || terminal || r.status === "FULFILLED"
                    }
                  >
                    <XCircle className="size-3 mr-1" />
                    Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Cancel this blood request?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark the request as CANCELLED, keep the record
                      in the database, store the cancellation audit, and cancel
                      pending donor assignments. This action should only be used
                      when the request is no longer valid.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl font-black">
                      Keep Request
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="rounded-xl bg-red-600 text-white hover:bg-red-700 font-black"
                      onClick={async () => {
                        try {
                          await cancelRequest({
                            id: r.id,
                            reason: "Cancelled by request manager",
                          }).unwrap();
                          toast.success("Request cancelled");
                        } catch (e: unknown) {
                          toast.error(
                            extractErrorMessage(e, "Failed to cancel request"),
                          );
                        }
                      }}
                    >
                      Confirm Cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        },
      },
    ],
    [
      cancelRequest,
      completeHandover,
      isCancelling,
      isCompleting,
      isRejecting,
      isStarting,
      rejectRequest,
      startProcessing,
    ],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getRowId: (row) => row.id,
    initialState: { pagination: { pageSize: 8 } },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-8 w-full animate-in fade-in duration-700">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-full sm:min-w-[300px] border rounded-2xl">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient, phone, hospital, organization, group..."
            className="h-14 px-6 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) =>
            setStatusFilter(v as BloodRequest["status"] | "ALL")
          }
        >
          <SelectTrigger className="border rounded-2xl py-7 w-[220px] dark:bg-zinc-950/50 font-black text-xs uppercase px-6">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40 shadow-premium p-1">
            <SelectItem value="ALL" className="font-bold rounded-lg my-1">
              All Status
            </SelectItem>
            {STATUS_FILTER_OPTIONS.map((s) => (
              <SelectItem
                key={s}
                value={s}
                className="font-bold rounded-lg my-1"
              >
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-[2rem] border-border/40 overflow-hidden shadow-none bg-card border-dashed">
        <CardContent className="p-0">
          <Table className="min-w-[1450px]">
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-border/40 h-20">
              {table.getHeaderGroups().map((group) => (
                <TableRow
                  key={group.id}
                  className="hover:bg-transparent border-none"
                >
                  {group.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="first:px-8 last:px-8 font-black uppercase text-[10px] "
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="h-24 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-all border-b border-border/20 last:border-none"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="first:px-8 last:px-8">
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
                    className="text-center py-24 text-muted-foreground font-medium opacity-40"
                  >
                    No requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()} - {filtered.length} requests
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase"
          >
            Next
          </Button>
        </div>
      </div>

      <NotifyDonorDialog
        request={rematchRequest}
        open={!!rematchRequest}
        onOpenChange={(open) => !open && setNotifyRequest(null)}
      />
    </div>
  );
}
