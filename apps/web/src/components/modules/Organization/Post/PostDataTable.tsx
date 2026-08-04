"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnDef,
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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Search,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Globe,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import type { ModerationPostRow } from "@/lib/post";
import { useUpdateOrgPostApprovalMutation } from "@/redux/features/posts/postsApi";

/* =========================================================
   Post Action Component
 ========================================================= */
function PostActionSelect({ post }: { post: ModerationPostRow }) {
  const [updateApproval] = useUpdateOrgPostApprovalMutation();

  const handleStatusChange = async (newStatus: string) => {
    try {
      if (newStatus === "Published") {
        await updateApproval({ id: post.id, approvalStatus: "APPROVED" }).unwrap();
        toast.success("Post successfully published.");
      } else if (newStatus === "Rejected") {
        await updateApproval({ id: post.id, approvalStatus: "REJECTED" }).unwrap();
        toast.error("Post has been rejected.");
      }
    } catch {
      toast.error("An error occurred while updating status.");
    }
  };

  if (post.status !== "Pending") {
    return (
      <div className="px-4 py-2 text-[10px] font-black uppercase text-muted-foreground/40 ">
        Resolved
      </div>
    );
  }

  return (
    <Select onValueChange={handleStatusChange}>
      <SelectTrigger className="h-10 w-[140px] rounded-xl border-dashed border-2 border-border/40 bg-zinc-50 dark:bg-zinc-900 font-black text-[9px] uppercase  focus:ring-primary/20">
        <SelectValue placeholder="TAKE ACTION" />
      </SelectTrigger>
      <SelectContent className="rounded-xl border-border/40 shadow-premium">
        <SelectItem value="Published" className="font-bold text-xs text-emerald-500 py-2">
          APPROVE
        </SelectItem>
        <SelectItem value="Rejected" className="font-bold text-xs text-red-500 py-2">
          REJECT
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

/* =========================================================
   Main Component
 ========================================================= */
export function PostDataTable({ data: initialData }: { data: ModerationPostRow[] }) {
  const [data, setData] = React.useState(initialData);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [typeFilter, setTypeFilter] = React.useState("All");

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        item.title.toLowerCase().includes(query) ||
        item.author.toLowerCase().includes(query) ||
        item.org.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      const matchesType =
        typeFilter === "All" || item.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [data, searchTerm, statusFilter, typeFilter]);

  const columns: ColumnDef<ModerationPostRow>[] = [
    {
      accessorKey: "title",
      header: "Post Details",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 max-w-[300px]">
          <Link
            href={`/post/${row.original.id}`}
            className="font-bold text-sm uppercase tracking-tighter text-foreground hover:text-primary transition-colors underline-offset-4 hover:underline line-clamp-1"
          >
            {row.original.title}
          </Link>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/5 text-primary border-primary/10 rounded-full px-2 py-0 h-4 font-black text-[7px] uppercase tracking-[0.1em]">
              {row.original.type}
            </Badge>
            <span className="text-[9px] font-bold text-muted-foreground opacity-40">#{row.original.id}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "author",
      header: "Author",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-[10px] text-primary shrink-0 border border-border/40">
            {row.original.author.charAt(0)}
          </div>
          <div className="space-y-0.5">
            <p className="font-black text-xs uppercase tracking-tight">
              {row.original.author}
            </p>
            <div className="flex items-center gap-1.5 opacity-60">
              <Globe className="size-3 text-primary" />
              <span className="text-[10px] font-bold">
                {row.original.org}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-tighter">
            <Calendar className="size-3 text-muted-foreground" />
            {row.original.date}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === "Published")
          return (
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-full px-3 py-1 font-black text-[8px] uppercase  gap-2 w-fit">
              <CheckCircle2 className="size-2.5" />
              Published
            </Badge>
          );
        if (status === "Pending")
          return (
            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 rounded-full px-3 py-1 font-black text-[8px] uppercase  gap-2 w-fit animate-pulse">
              <TrendingUp className="size-2.5" />
              Pending
            </Badge>
          );
        if (status === "Rejected")
          return (
            <Badge className="bg-red-500/10 text-red-500 border-red-500/20 rounded-full px-3 py-1 font-black text-[8px] uppercase  gap-2 w-fit">
              <XCircle className="size-2.5" />
              Rejected
            </Badge>
          );
        return (
          <Badge className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20 rounded-full px-3 py-1 font-black text-[8px] uppercase  gap-2 w-fit">
            <FileText className="size-2.5" />
            Draft
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right px-4">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-3 px-4">
          <PostActionSelect post={row.original} />
          <Button asChild variant="outline" className="h-10 rounded-xl border-border/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all group font-black text-[9px] uppercase  px-4 shadow-none">
            <Link href={`/post/${row.original.id}`} className="flex items-center gap-2">
              <Eye className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              View
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, author or organization..."
            className="h-14 pl-12 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="border rounded-2xl py-7 w-[160px] dark:bg-zinc-950/50 font-black text-xs uppercase px-6">
              <div className="flex items-center gap-2">
                <SelectValue placeholder="Category" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40 shadow-premium p-1">
              <SelectItem value="All" className="font-bold rounded-lg my-1">All Types</SelectItem>
              <SelectItem value="URGENT" className="font-bold rounded-lg my-1">Urgent</SelectItem>
              <SelectItem value="EMERGENCY" className="font-bold rounded-lg my-1">Emergency</SelectItem>
              <SelectItem value="EVENT" className="font-bold rounded-lg my-1">Event</SelectItem>
              <SelectItem value="ANNOUNCEMENT" className="font-bold rounded-lg my-1">Announcement</SelectItem>
              <SelectItem value="GENERAL" className="font-bold rounded-lg my-1">General</SelectItem>
              <SelectItem value="RECAP" className="font-bold rounded-lg my-1">Recap</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border rounded-2xl py-7 w-[160px] dark:bg-zinc-950/50 font-black text-xs uppercase px-6">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40 shadow-premium p-1">
              <SelectItem value="All" className="font-bold rounded-lg my-1">All Status</SelectItem>
              <SelectItem value="Pending" className="font-bold rounded-lg my-1 text-amber-600">Pending</SelectItem>
              <SelectItem value="Published" className="font-bold rounded-lg my-1 text-emerald-600">Published</SelectItem>
              <SelectItem value="Rejected" className="font-bold rounded-lg my-1 text-red-600">Rejected</SelectItem>
              <SelectItem value="Draft" className="font-bold rounded-lg my-1 text-zinc-500">Draft</SelectItem>
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
                <TableRow key={group.id} className="hover:bg-transparent border-none">
                  {group.headers.map((header) => (
                    <TableHead key={header.id} className="first:px-8 last:px-8 font-black uppercase text-[10px]  text-muted-foreground">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="h-24 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-all border-b border-border/20 last:border-none">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="first:px-8 last:px-8">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-24 text-muted-foreground font-medium opacity-40 ">
                    No broadcasts found matching your current matrix.
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
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} · {filteredData.length} entries
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