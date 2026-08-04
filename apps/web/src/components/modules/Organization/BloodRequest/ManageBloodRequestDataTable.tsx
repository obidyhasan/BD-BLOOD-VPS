"use client";

import * as React from "react";
import Link from "next/link";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnDef,
  Row,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Search,
  Calendar,
  Droplets,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Check,
  XCircle,
  Edit2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { bloodGroup } from "@/constant/BloodGroup";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";

import { BloodRequestRow } from "@/lib/bloodRequest";
import {
  useUpdateBloodRequestStatusMutation,
} from "@/redux/features/bloodRequests/bloodRequestsApi";
import { useGetPublicDonorsQuery } from "@/redux/features/donors/donorsApi";
import type { Donor as ApiDonor } from "@/redux/features/donors/donorsApi";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

/* =========================================================
   Main Component
 ========================================================= */
export function ManageBloodRequestDataTable({
  data: initialData,
  isAdmin = false,
}: {
  data: BloodRequestRow[];
  isAdmin?: boolean;
}) {
  const [rawData, setRawData] = React.useState(initialData);

  React.useEffect(() => {
    setRawData(initialData);
  }, [initialData]);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [selectedBloodGroup, setSelectedBloodGroup] = React.useState("All");
  const [organizationFilter, setOrganizationFilter] = React.useState("All");

  const orgOptions = React.useMemo(() => {
    const names = rawData.map(d => d.organizationName).filter(Boolean) as string[];
    return Array.from(new Set(names));
  }, [rawData]);

  /* =========================================================
     Action Dialogs
  ========================================================= */
  const [updateStatus] = useUpdateBloodRequestStatusMutation();

  const ManageRequestActionDialogs = ({ request }: { request: BloodRequestRow }) => {
    const [qty, setQty] = React.useState(request.quantity);
    const [date, setDate] = React.useState<Date | undefined>(
      request.needDate ? parseISO(request.needDate) : undefined
    );

    // Accept Modal States
    const [selectedDonors, setSelectedDonors] = React.useState<{ donor: ApiDonor; units: number }[]>([]);

    const { data: donorsData, isLoading: isLoadingDonors } = useGetPublicDonorsQuery(
      {
        limit: 100,
        bloodGroupId: undefined,
        availabilityStatus: "AVAILABLE",
      },
      { skip: request.status !== "pending" },
    );

    const donors = React.useMemo(
      () =>
        (donorsData?.data ?? []).filter(
          (d) => d.bloodGroup?.groupName === request.bloodGroup,
        ),
      [donorsData, request.bloodGroup],
    );

    const totalRequestedUnits = parseInt(request.quantity) || 1;
    const currentSelectedUnits = selectedDonors.reduce((acc, curr) => acc + curr.units, 0);

    const handleReject = async () => {
      try {
        await updateStatus({
          id: request.apiId,
          status: "REJECTED",
        }).unwrap();
        toast.error(`Request #${request.id} has been rejected`);
      } catch (err: unknown) {
        const message =
          (err as { data?: { message?: string } })?.data?.message ||
          "Failed to update request.";
        toast.error(message);
      }
    };

    const handleAcceptSubmit = async () => {
      if (currentSelectedUnits < totalRequestedUnits) {
        toast.warning(`Please select donors for all ${totalRequestedUnits} units`);
        return;
      }

      try {
        await updateStatus({
          id: request.apiId,
          status: "PROCESSING",
        }).unwrap();
        toast.success("Request is now being processed.");
      } catch (err: unknown) {
        const message =
          (err as { data?: { message?: string } })?.data?.message ||
          "Failed to update request.";
        toast.error(message);
      }
    };

    const toggleDonorSelection = (donor: ApiDonor) => {
      const isSelected = selectedDonors.find(sd => sd.donor.id === donor.id);
      if (isSelected) {
        setSelectedDonors(selectedDonors.filter(sd => sd.donor.id !== donor.id));
      } else {
        if (currentSelectedUnits >= totalRequestedUnits) {
          toast.info("All requested units are already assigned.");
          return;
        }
        setSelectedDonors([...selectedDonors, { donor, units: 1 }]);
      }
    };

    const updateDonorUnits = (donorId: string, units: number) => {
      setSelectedDonors(selectedDonors.map(sd =>
        sd.donor.id === donorId ? { ...sd, units } : sd
      ));
    };

    return (
      <div className="flex items-center gap-2">
        {/* Accept Button & Modal */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={request.status !== "pending"}
              className={`rounded-xl px-5 h-10 font-black text-[9px] uppercase  border-dashed border-2 transition-all shadow-none
                ${request.status === "pending"
                  ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10"
                  : "opacity-50 cursor-not-allowed"
                }`}
            >
              Accept
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[3.5rem] border-border/40 p-10 max-w-2xl shadow-2xl">
            <DialogHeader className="gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-4xl font-black uppercase">
                    Assign Donors
                  </DialogTitle>
                  <DialogDescription className="text-sm font-medium text-muted-foreground">
                    Select {totalRequestedUnits} unit(s) of {request.bloodGroup} donors for {request.name}.
                  </DialogDescription>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 h-12 px-6 rounded-2xl font-black text-sm">
                  {currentSelectedUnits} / {totalRequestedUnits} Units
                </Badge>
              </div>
            </DialogHeader>

            <div className="py-6 border-y border-border/20 my-4 space-y-6">
              <ScrollArea className="h-[300px] pr-4">
                {isLoadingDonors ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-xs font-black uppercase  text-muted-foreground animate-pulse">Scanning Donor Database...</p>
                  </div>
                ) : donors.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <Droplets className="size-12 mx-auto text-muted-foreground/20" />
                    <p className="text-sm font-bold text-muted-foreground">No available {request.bloodGroup} donors found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {donors.map((donor) => {
                      const selection = selectedDonors.find(sd => sd.donor.id === donor.id);
                      return (
                        <div
                          key={donor.id}
                          className={`group flex items-center justify-between p-4 rounded-3xl border-2 transition-all cursor-pointer
                            ${selection
                              ? "border-emerald-500 bg-emerald-500/5"
                              : "border-border/40 hover:border-primary/40 bg-zinc-50/50 dark:bg-zinc-900/50"}`}
                          onClick={() => toggleDonorSelection(donor)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`size-12 rounded-2xl flex items-center justify-center font-black text-sm transition-colors
                              ${selection ? "bg-emerald-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"}`}>
                              {donor.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-sm uppercase tracking-tight text-foreground">{donor.fullName}</p>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase ">
                                <MapPin className="size-3" />
                                {donor.lastDonationDate || "No recent donations"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                            {selection && totalRequestedUnits > 1 && (
                              <div className="flex items-center gap-2 bg-white dark:bg-zinc-950 border border-emerald-500/20 rounded-xl p-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 rounded-lg"
                                  onClick={() => updateDonorUnits(donor.id, Math.max(1, selection.units - 1))}
                                >
                                  -
                                </Button>
                                <span className="font-black text-xs min-w-[20px] text-center">{selection.units}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 rounded-lg"
                                  onClick={() => {
                                    if (currentSelectedUnits < totalRequestedUnits) {
                                      updateDonorUnits(donor.id, selection.units + 1);
                                    } else {
                                      toast.warning("Cannot exceed requested units");
                                    }
                                  }}
                                >
                                  +
                                </Button>
                              </div>
                            )}
                            <div className={`size-6 rounded-full flex items-center justify-center border-2 transition-all
                              ${selection ? "bg-emerald-500 border-emerald-500 text-white" : "border-border/60"}`}>
                              {selection && <Check className="size-4" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            <DialogFooter className="grid grid-cols-2 gap-4">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="h-16 rounded-2xl font-black text-xs uppercase  border-border/40"
                >
                  Cancel
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  onClick={handleAcceptSubmit}
                  disabled={currentSelectedUnits === 0}
                  className="h-16 rounded-2xl bg-zinc-950 text-white font-black text-xs uppercase  shadow-xl shadow-zinc-950/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Confirm & Process
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={request.status !== "pending"}
              className={`rounded-xl px-5 h-10 font-black text-[9px] uppercase  border-dashed border-2 transition-all shadow-none
                ${request.status === "pending"
                  ? "border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500/10"
                  : "opacity-50 cursor-not-allowed"
                }`}
            >
              Reject
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[3rem] border-border/40 p-10 max-w-md shadow-2xl">
            <DialogHeader className="gap-4 text-center items-center">
              <div className="size-20 rounded-[2rem] bg-orange-500/10 text-orange-500 flex items-center justify-center mb-2">
                <XCircle className="size-10" />
              </div>
              <DialogTitle className="text-4xl font-black uppercase text-orange-500">
                Reject Request?
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground text-center">
                Are you sure you want to reject request <b className="text-foreground">#{request.id}</b>?
                This will mark the request as invalid or unattainable.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="grid grid-cols-2 gap-4 mt-8">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="h-16 rounded-2xl font-black text-xs uppercase  border-border/40"
                >
                  Abort
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  className="h-16 rounded-2xl bg-orange-500 text-white font-black text-xs uppercase  shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all hover:bg-orange-600"
                  onClick={handleReject}
                >
                  Confirm Reject
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              disabled={request.status !== "pending"}
              className={`rounded-xl size-10 border-border/40 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-none
                ${request.status !== "pending" ? "opacity-20 cursor-not-allowed" : ""}`}
            >
              <Edit2 className="size-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[3rem] border-border/40 p-10 max-w-lg shadow-2xl">
            <DialogHeader className="gap-4">
              <DialogTitle className="text-4xl font-black uppercase">
                Edit Request
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground">
                Modify logistical parameters for request #{request.id}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6 border-y border-border/20 my-2">
              <div className="space-y-2">
                <Label
                  htmlFor={`edit-qty-${request.id}`}
                  className="text-[10px] font-black uppercase text-muted-foreground  px-1"
                >
                  Unit Quantity
                </Label>
                <Input
                  id={`edit-qty-${request.id}`}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="h-14 rounded-2xl border-border/40 bg-zinc-50 dark:bg-zinc-900 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor={`edit-date-${request.id}`}
                  className="text-[10px] font-black uppercase text-muted-foreground  px-1"
                >
                  Required Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "h-14 w-full justify-start text-left font-bold rounded-2xl border-border/40 bg-zinc-50 dark:bg-zinc-900",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4 text-primary" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl border-border/40" align="start">
                    <ShadcnCalendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className="p-3"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter className="grid grid-cols-2 gap-4">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="h-16 rounded-2xl font-black text-xs uppercase  border-border/40"
                >
                  Cancel
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button
                  className="h-16 rounded-2xl bg-zinc-950 text-white font-black text-xs uppercase  shadow-xl shadow-zinc-950/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  onClick={() => {
                    toast.info(
                      "Quantity and date are read-only. Use Accept or Reject to update request status.",
                    );
                  }}
                >
                  Save Changes
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const data = React.useMemo(() => {
    return rawData.filter((item) => {
      const matchesSearch =
        item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item?.phone?.includes(searchTerm) ||
        item.hospital?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
        item?.bloodGroup?.toLowerCase().includes(searchTerm?.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Approved" && item.status === "approved") ||
        (statusFilter === "Pending" && item.status === "pending") ||
        (statusFilter === "Rejected" && item.status === "rejected") ||
        (statusFilter === "Processing" && item.status === "processing") ||
        (statusFilter === "Accepted" && item.status === "accepted");

      const matchesBloodGroup =
        selectedBloodGroup === "All" || item.bloodGroup === selectedBloodGroup;

      const matchesOrganization =
        !isAdmin || organizationFilter === "All" || item.organizationName === organizationFilter;

      return matchesSearch && matchesStatus && matchesBloodGroup && matchesOrganization;
    });
  }, [rawData, searchTerm, statusFilter, selectedBloodGroup, organizationFilter, isAdmin]);

  /* =========================================================
     Columns
  ========================================================= */
  const columns: ColumnDef<BloodRequestRow>[] = [
    {
      accessorKey: "name",
      header: "Patient",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-[10px] text-primary">
            {row.original.name.charAt(0)}
          </div>
          <div className="space-y-0.5">
            <p className="font-black text-xs uppercase tracking-tight">
              {row.original.name}
            </p>
            <div className="flex items-center gap-1.5">
              <Phone className="size-3 text-primary" />
              <span className="text-[10px] font-bold opacity-60">
                {row.original.phone}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "bloodGroup",
      header: "Group",
      cell: ({ row }) => (
        <Badge className="bg-red-500/10 text-red-500 border-red-500/20 rounded-lg px-3 py-1 font-black text-[10px]  flex items-center gap-2 w-fit">
          <Droplets className="size-3 fill-red-500" />
          {row.original.bloodGroup}
        </Badge>
      ),
    },
    {
      accessorKey: "hospital",
      header: "Hospital",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-foreground font-bold text-xs opacity-60">
          <MapPin className="size-3 text-primary" />
          {row.original.hospital}
        </div>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Units",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-black text-sm tracking-tighter">
            {row.original.quantity}
          </span>
          <span className="text-[8px] font-black uppercase text-muted-foreground opacity-40 ">
            Bags
          </span>
        </div>
      ),
    },
    {
      accessorKey: "needDate",
      header: "Required By",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-zinc-500 font-bold text-xs uppercase">
          <Calendar className="size-3" />
          {row.original.needDate}
        </div>
      ),
    },
    {
      accessorKey: "assignedDonors",
      header: "Assigned Donors",
      cell: ({ row }) => {
        const donors = row.original.assignedDonors;
        if (!donors || donors.length === 0) return (
          <span className="text-[10px] font-bold text-muted-foreground opacity-40 uppercase">Unassigned</span>
        );
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {donors.map((donor) => (
              <Link
                key={donor.id}
                href={`/donor/${donor.slug}`}
                className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-primary/10 hover:text-primary px-2 py-0.5 rounded-md text-[9px] font-black uppercase transition-colors"
              >
                <Users className="size-2.5" />
                {donor.name}
              </Link>
            ))}
          </div>
        );
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        if (s === "approved") return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-full px-3 py-1 font-black text-[8px] uppercase  gap-2 w-fit">
            <CheckCircle2 className="size-2.5" />
            Approved
          </Badge>
        );
        if (s === "pending") return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 rounded-full px-3 py-1 font-black text-[8px] uppercase  gap-2 w-fit">
            <Clock className="size-2.5" />
            Pending
          </Badge>
        );
        if (s === "rejected") return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20 rounded-full px-3 py-1 font-black text-[8px] uppercase  gap-2 w-fit">
            <XCircle className="size-2.5" />
            Rejected
          </Badge>
        );
        if (s === "processing") return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 rounded-full px-3 py-1 font-black text-[8px] uppercase  gap-2 w-fit">
            <Clock className="size-2.5 animate-pulse" />
            Processing
          </Badge>
        );
        if (s === "accepted") return (
          <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 rounded-full px-3 py-1 font-black text-[8px] uppercase  gap-2 w-fit">
            <CheckCircle2 className="size-2.5" />
            Accepted
          </Badge>
        );
        return null;
      }
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <ManageRequestActionDialogs request={row.original} />
        </div>
      ),
    },
  ];

  if (isAdmin) {
    columns.splice(3, 0, {
      accessorKey: "organizationName",
      header: "Organization",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-black text-[9px] uppercase  border-border/60">
          {row.original.organizationName || "Unassigned"}
        </Badge>
      ),
    });
  }

  /* =========================================================
     Table
  ========================================================= */
  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id.toString(),
    initialState: { pagination: { pageSize: 8 } },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  /* =========================================================
     UI
  ========================================================= */
  return (
    <div className="space-y-8 w-full animate-in fade-in duration-700">
      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-4"
      >
        <div className="relative flex-1 min-w-full sm:min-w-[300px] border rounded-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient, hospital or phone..."
            className="h-14 pl-12 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
          />
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
              <SelectTrigger className="border rounded-2xl py-7 w-[200px] dark:bg-zinc-950/50 font-black text-xs uppercase px-6">
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/40 shadow-premium">
                <SelectItem value="All" className="font-bold rounded-lg my-1">All Orgs</SelectItem>
                {orgOptions.map((org) => (
                  <SelectItem key={org} value={org} className="font-bold rounded-lg my-1">
                    {org}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={selectedBloodGroup} onValueChange={setSelectedBloodGroup}>
            <SelectTrigger className="border rounded-2xl py-7 w-[160px] dark:bg-zinc-950/50 font-black text-xs uppercase px-6">
              <SelectValue placeholder="Blood Group" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40 shadow-premium">
              <SelectItem value="All" className="font-bold rounded-lg my-1">All Groups</SelectItem>
              {bloodGroup.map((group) => (
                <SelectItem key={group} value={group} className="font-bold rounded-lg my-1">
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border rounded-2xl py-7 w-[180px] dark:bg-zinc-950/50 font-black text-xs uppercase px-6">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40 shadow-premium p-1">
              <SelectItem value="All" className="font-bold rounded-lg my-1">
                All Status
              </SelectItem>
              <SelectItem value="Pending" className="font-bold rounded-lg my-1 text-amber-600">
                Pending
              </SelectItem>
              <SelectItem value="Approved" className="font-bold rounded-lg my-1 text-emerald-600">
                Approved
              </SelectItem>
              <SelectItem value="Processing" className="font-bold rounded-lg my-1 text-blue-600">
                Processing
              </SelectItem>
              <SelectItem value="Accepted" className="font-bold rounded-lg my-1 text-purple-600">
                Accepted
              </SelectItem>
              <SelectItem value="Rejected" className="font-bold rounded-lg my-1 text-red-600">
                Rejected
              </SelectItem>
            </SelectContent>
          </Select>
        </div>


      </motion.div>

      {/* Table Card */}
      <Card className="rounded-[3rem] border-border/40 overflow-hidden shadow-none bg-card border-dashed">
        <CardContent className="p-0">
          <Table className="min-w-[1000px]">
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
                    className="h-24 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-all border-b border-border/20 last:border-none relative z-0"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="first:px-8 last:px-8">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                    No requests found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Ledger */}
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()} · {data.length} requests
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase"
          >
            <ChevronLeft className="size-4" />
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
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}