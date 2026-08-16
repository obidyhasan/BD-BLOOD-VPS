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
import {
  Search,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import * as React from "react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrganizationDashboardContext } from "@/hooks/useOrganizationDashboardContext";
import { useGetOrganizationInventoryQuery } from "@/redux/features/inventory/inventoryApi";
import {
  formatInventoryUpdated,
  inventoryStockStatus,
  type InventoryStockStatus,
} from "@/lib/inventory";

export type InventoryItem = {
  id?: string;
  bloodGroupId: string;
  group: string;
  units: number;
  updated: string;
  status: InventoryStockStatus;
};

const toneByStatus = (status: string) => {
  if (status === "Available")
    return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  if (status === "Low")
    return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  if (status === "Critical" || status === "Out")
    return "bg-red-500/10 text-red-500 border-red-500/20";
  return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
};

const InventoryPage = () => {
  const { organizationId, isLoading: membershipLoading } =
    useOrganizationDashboardContext();

  const { data: inventoryData, isLoading: inventoryLoading } =
    useGetOrganizationInventoryQuery(organizationId!, {
      skip: !organizationId,
    });

  const inventory: InventoryItem[] = useMemo(() => {
    return (inventoryData?.data ?? []).map((row) => ({
      id: row.id,
      bloodGroupId: row.bloodGroupId,
      group: row.bloodGroup.groupName,
      units: row.availableUnits,
      updated: formatInventoryUpdated(row.lastUpdated),
      status: inventoryStockStatus(row.availableUnits),
    }));
  }, [inventoryData]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const columns: ColumnDef<InventoryItem>[] = useMemo(
    () => [
      {
        accessorKey: "group",
        header: "Blood Group",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-sm tracking-tighter shadow-sm text-primary">
              {row.original.group}
            </div>
            <span className="font-bold text-foreground text-sm uppercase tracking-tighter">
              Verified Stock
            </span>
          </div>
        ),
      },
      {
        accessorKey: "units",
        header: "Available Units",
        cell: ({ row }) => (
          <div className="flex items-baseline gap-1">
            <span className="font-black text-lg text-foreground tracking-tighter">
              {row.original.units}
            </span>
            <span className="text-[10px] text-muted-foreground opacity-40 font-bold uppercase">
              Units
            </span>
          </div>
        ),
      },
      {
        accessorKey: "updated",
        header: "Last Update",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
            <Clock className="size-3 opacity-40" />
            {row.original.updated}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={`rounded-full px-4 py-1 text-[10px] font-black uppercase  border ${toneByStatus(row.original.status)}`}
          >
            {row.original.status}
          </Badge>
        ),
      },
    ],
    [],
  );

  const filteredData = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch = item.group
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [inventory, searchQuery, statusFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
  });

  const loading = membershipLoading || inventoryLoading;

  if (!membershipLoading && !organizationId) {
    return (
      <div className="rounded-2xl border border-border/40 bg-white dark:bg-zinc-900 p-8 text-center">
        <p className="font-bold text-muted-foreground">
          Select an organization to manage inventory.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <DashboardHeader
          variant="clinical"
          title="Blood Inventory"
          subtitle="Eligible active donors, grouped by blood type in real time."
          badge="Donor Availability"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
          <Input
            placeholder="Search blood group..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-11 rounded-2xl border-border/40 bg-white dark:bg-zinc-900"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-12 w-full sm:w-48 rounded-2xl border-border/40 bg-white dark:bg-zinc-900">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            {["All", "Available", "Low", "Critical", "Out"].map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="rounded-[2.5rem] border-border/40 shadow-none overflow-hidden bg-white dark:bg-zinc-900">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="border-border/40 hover:bg-transparent"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="text-[10px] font-black uppercase  text-muted-foreground/60 h-14"
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
                    <TableRow key={row.id} className="border-border/40">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-5">
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
                      className="h-32 text-center text-muted-foreground font-medium"
                    >
                      No inventory records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!loading && table.getPageCount() > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between"
        >
          <p className="text-xs font-bold text-muted-foreground uppercase ">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default InventoryPage;
