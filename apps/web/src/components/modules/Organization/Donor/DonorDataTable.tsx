"use client";

import * as React from "react";
import { bloodGroup } from "@/constant/BloodGroup";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnDef,
  Row,
  VisibilityState,
} from "@tanstack/react-table";

import { z } from "zod";

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
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import {
  Search,
  Droplets,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Activity,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion } from "motion/react";

/* =========================================================
   Schema
 ========================================================= */
export const donorSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  bloodGroup: z.string(),
  phone: z.string(),
  district: z.string(),
  lastDonationDate: z.string(),
  available: z.boolean(),
  accountStatus: z.enum(["active", "deactive", "suspended"]),
});

type Donor = z.infer<typeof donorSchema>;

import Link from "next/link";
import {
  useAssignOrganizationMemberMutation,
  useGetAllPositionsQuery,
  useGetOrganizationMembersQuery,
  useUpdateMemberStatusMutation,
} from "@/redux/features/organizations/organizationsApi";
import { useOrganizationDashboardContext } from "@/hooks/useOrganizationDashboardContext";

function MemberManager({ donor }: { donor: Donor }) {
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [pendingValue, setPendingValue] = React.useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = React.useState<string | null>(
    null,
  );

  const { organizationId } = useOrganizationDashboardContext();

  const { data: membersData } = useGetOrganizationMembersQuery(organizationId, {
    skip: !organizationId,
  });
  const { data: positionsData } = useGetAllPositionsQuery();
  const [assignMember] = useAssignOrganizationMemberMutation();
  const [updateMemberStatus] = useUpdateMemberStatusMutation();

  const memberRecord = React.useMemo(
    () => (membersData?.data ?? []).find((m) => m.donorId === donor.id),
    [membersData, donor.id],
  );
  const isMember = Boolean(memberRecord);
  const positions = positionsData?.data ?? [];

  const handleCommit = async () => {
    if (!pendingValue) return;
    try {
      if (pendingValue === "member") {
        if (!selectedPosition) {
          toast.error("Please select a position first.");
          return;
        }
        await assignMember({
          donorId: donor.id,
          positionId: selectedPosition,
          organizationId,
        }).unwrap();
        const posName = positions.find(
          (p) => p.id === selectedPosition,
        )?.positionName;
        toast.success(`${donor.name} established as ${posName ?? "member"}`);
      } else if (memberRecord) {
        await updateMemberStatus({
          memberId: memberRecord.id,
          status: "REJECTED",
        }).unwrap();
        toast.success(`${donor.name} permissions revoked to Donor`);
      }
    } catch {
      toast.error("Update failed");
    } finally {
      setIsAlertOpen(false);
      setPendingValue(null);
      setSelectedPosition(null);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Select
        value={isMember ? "member" : "donor"}
        onValueChange={(val) => {
          setPendingValue(val);
          setIsAlertOpen(true);
        }}
      >
        <SelectTrigger
          className={`h-11 w-[130px] rounded-xl border-dashed border-2 font-black text-[10px] uppercase  px-4 transition-all shadow-none
          ${isMember ? "border-primary/20 text-primary bg-primary/5" : "border-zinc-500/20 text-muted-foreground bg-zinc-500/5"}`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck
              className={`size-3 ${isMember ? "opacity-100" : "opacity-20"}`}
            />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-border/40 shadow-premium p-1">
          <SelectItem
            value="donor"
            className="rounded-xl font-bold text-[10px] uppercase py-3 "
          >
            General
          </SelectItem>
          <SelectItem
            value="member"
            className="rounded-xl font-bold text-[10px] uppercase py-3  text-primary "
          >
            Member
          </SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DialogContent className="rounded-[3rem] border-border/40 p-10 max-w-md shadow-2xl">
          <DialogHeader className="gap-4 text-center items-center">
            <div className="size-20 rounded-[2rem] bg-primary/5 text-primary flex items-center justify-center mb-2">
              <ShieldCheck className="size-10" />
            </div>
            <DialogTitle className="text-4xl font-black  uppercase ">
              Clearance Shift
            </DialogTitle>
            <DialogDescription className="text-sm font-medium  text-muted-foreground text-center">
              Reconfiguring authorization for {donor.name}. Are you absolute
              sure you want to shift this node to{" "}
              <b className="text-primary">
                {pendingValue === "member"
                  ? "ORGANIZATION MEMBER"
                  : "GENERAL DONOR"}
              </b>
              ?
            </DialogDescription>
          </DialogHeader>

          {pendingValue === "member" && (
            <div className="space-y-4 my-6">
              <Label className="font-black text-[10px] uppercase  opacity-40">
                Select Protocol Position
              </Label>
              <Select
                value={selectedPosition || ""}
                onValueChange={setSelectedPosition}
              >
                <SelectTrigger className="py-7 w-full rounded-2xl border-border/40 bg-zinc-50 dark:bg-zinc-950 font-bold text-xs">
                  <SelectValue placeholder="CHOOSE ROLE" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40 shadow-premium">
                  {positions.map((pos) => (
                    <SelectItem
                      key={pos.id}
                      value={pos.id}
                      className="font-bold text-xs py-3"
                    >
                      {pos.positionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-12 rounded-2xl font-black text-xs uppercase  border-border/40"
              onClick={() => setIsAlertOpen(false)}
            >
              Abort
            </Button>
            <Button
              className="h-12 rounded-2xl bg-primary text-white font-black text-xs uppercase  shadow-xl shadow-zinc-950/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              onClick={handleCommit}
              disabled={pendingValue === "member" && !selectedPosition}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusManager({ donor }: { donor: Donor }) {
  const [pendingStatus, setPendingStatus] = React.useState<string | null>(null);
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);

  const handleStatusCommit = async () => {
    if (!pendingStatus) return;
    toast.info(
      "Donor account status updates require the admin donor API (not yet wired here).",
    );
    try {
      setIsAlertOpen(false);
      setPendingStatus(null);
    } finally {
      setIsAlertOpen(false);
      setPendingStatus(null);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Select
        value={donor.accountStatus}
        onValueChange={(val) => {
          setPendingStatus(val);
          setIsAlertOpen(true);
        }}
      >
        <SelectTrigger
          className={`h-11 w-[130px] rounded-xl border-dashed border-2 font-black text-[10px] uppercase  px-4 transition-all shadow-none
          ${donor.accountStatus === "active"
              ? "border-emerald-500/20 text-emerald-600 bg-emerald-500/5"
              : donor.accountStatus === "suspended"
                ? "border-red-500/20 text-red-600 bg-red-500/5"
                : "border-zinc-500/20 text-zinc-600 bg-zinc-500/5"
            }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`size-2 rounded-full ${donor.accountStatus === "active" ? "bg-emerald-500" : donor.accountStatus === "suspended" ? "bg-red-500" : "bg-zinc-400"}`}
            />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-border/40 shadow-premium p-1">
          <SelectItem
            value="active"
            className="rounded-xl font-bold text-[10px] uppercase py-3 text-emerald-600"
          >
            Active
          </SelectItem>
          <SelectItem
            value="deactive"
            className="rounded-xl font-bold text-[10px] uppercase py-3 text-amber-600"
          >
            Deactive
          </SelectItem>
          <SelectItem
            value="suspended"
            className="rounded-xl font-bold text-[10px] uppercase py-3 text-red-600"
          >
            Suspend
          </SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DialogContent className="rounded-[2.5rem] border-border/40 p-10 max-w-md shadow-2xl">
          <DialogHeader className="gap-2 text-center items-center">
            <div className="size-20 rounded-[2rem] bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
              <AlertCircle className="size-10" />
            </div>
            <DialogTitle className="text-3xl font-black uppercase ">
              Authorization
            </DialogTitle>
            <DialogDescription className="text-sm font-medium  text-muted-foreground text-center">
              Are you absolute sure you want to shift node {donor.id} to{" "}
              {pendingStatus} protocol?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-14 rounded-2xl font-black text-xs uppercase  border-border/40"
              onClick={() => setIsAlertOpen(false)}
            >
              Abort
            </Button>
            <Button
              className="h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase  shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              onClick={handleStatusCommit}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const columns: ColumnDef<Donor>[] = [
  {
    accessorKey: "name",
    header: "Profile",
    cell: ({ row }) => (
      <Link href={`/donor/${row.original.slug}`}>
        <Button
          variant="ghost"
          className="text-foreground w-fit px-0 text-left hover:text-primary transition-colors h-auto group flex items-center gap-2"
        >
          <div className="size-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-[10px] text-primary">
            {row.original.name.charAt(0)}
          </div>
          <span className="font-black text-xs uppercase  decoration-primary/20 decoration-2 transition-all underline-offset-4 group-hover:underline">
            {row.original.name}
          </span>
          <ExternalLink className="size-3 opacity-20 group-hover:opacity-100 transition-all ml-1" />
        </Button>
      </Link>
    ),
    enableHiding: false,
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
    accessorKey: "phone",
    header: "Contact",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-foreground font-bold text-xs opacity-60">
        <Phone className="size-3 text-primary" />
        {row.original.phone}
      </div>
    ),
  },
  {
    accessorKey: "district",
    header: "Location",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-foreground font-bold text-xs opacity-60 ">
        <MapPin className="size-3 text-primary" />
        {row.original.district}
      </div>
    ),
  },
  {
    accessorKey: "lastDonationDate",
    header: "Last Donation",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-zinc-500 font-bold text-xs uppercase ">
        <Calendar className="size-3" />
        {row.original.lastDonationDate}
      </div>
    ),
  },
  {
    accessorKey: "available",
    header: "Availability",
    cell: ({ row }) =>
      row.original.available ? (
        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-full px-3 py-1 font-black text-[8px] uppercase  gap-2 w-fit">
          <CheckCircle2 className="size-2.5" />
          Ready
        </Badge>
      ) : (
        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 rounded-full px-3 py-1 font-black text-[8px] uppercase  gap-2 w-fit">
          <Clock className="size-2.5" />
          Recovery
        </Badge>
      ),
  },
  {
    id: "accountStatus",
    header: "Account Status",
    cell: ({ row }) => <StatusManager donor={row.original} />,
  },
  {
    id: "isMember",
    header: "Member",
    cell: ({ row }) => <MemberManager donor={row.original} />,
  },
];

function StandardRow({ row }: { row: Row<Donor> }) {
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      className="h-24 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-all border-b border-border/20 last:border-none relative z-0"
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id} className="first:px-8 last:px-8">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

/* =========================================================
   Main Component
 ========================================================= */
export function DonorDataTable({ data: initialData }: { data: Donor[] }) {
  const [rawData, setRawData] = React.useState(initialData);

  React.useEffect(() => {
    setRawData(initialData);
  }, [initialData]);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedBloodGroup, setSelectedBloodGroup] = React.useState("All");
  const [availabilityFilter, setAvailabilityFilter] = React.useState("All");

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const data = React.useMemo(() => {
    return rawData.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone.includes(searchQuery) ||
        item.district.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBlood =
        selectedBloodGroup === "All" || item.bloodGroup === selectedBloodGroup;

      const matchesStatus =
        availabilityFilter === "All" ||
        (availabilityFilter === "available" && item.available) ||
        (availabilityFilter === "unavailable" && !item.available);

      return matchesSearch && matchesBlood && matchesStatus;
    });
  }, [rawData, searchQuery, selectedBloodGroup, availabilityFilter]);

  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility,
      rowSelection,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone or location..."
            className="h-14 pl-12 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={selectedBloodGroup}
            onValueChange={setSelectedBloodGroup}
          >
            <SelectTrigger className="border rounded-2xl py-7 w-[160px] dark:bg-zinc-950/50 font-black text-xs uppercase px-6">
              <SelectValue placeholder="Blood Group" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40 shadow-premium">
              <SelectItem value="All" className="font-bold rounded-lg my-1">
                All Groups
              </SelectItem>
              {bloodGroup.map((group) => (
                <SelectItem
                  key={group}
                  value={group}
                  className="font-bold rounded-lg my-1"
                >
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={availabilityFilter}
            onValueChange={setAvailabilityFilter}
          >
            <SelectTrigger className="border rounded-2xl py-7 w-[150px] dark:bg-zinc-950/50 font-black text-xs uppercase  px-6">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40 shadow-premium">
              <SelectItem value="All" className="font-bold rounded-lg my-1">
                All Status
              </SelectItem>
              <SelectItem
                value="available"
                className="font-bold rounded-lg my-1"
              >
                Available
              </SelectItem>
              <SelectItem
                value="unavailable"
                className="font-bold rounded-lg my-1"
              >
                Unavailable
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <Card className="rounded-[3rem] border-border/40 overflow-hidden shadow-none bg-card border-dashed">
        <CardContent className="p-0">
          <>
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
                        colSpan={header.colSpan}
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

              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <>
                    {table.getRowModel().rows.map((row) => (
                      <StandardRow key={row.id} row={row} />
                    ))}
                  </>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center py-24  text-muted-foreground font-medium opacity-40"
                    >
                      Search protocol yielded zero matching donor nodes.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </>
        </CardContent>
      </Card>

      {/* Pagination Ledger */}
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()} · {data.length} donors
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase "
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase "
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
