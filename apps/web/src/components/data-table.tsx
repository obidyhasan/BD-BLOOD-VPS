"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
} from "@tabler/icons-react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity } from "lucide-react";

export const schema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
});

function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({ id });
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent cursor-grab"
    >
      <IconGripVertical className="size-3" />
    </Button>
  );
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [

  {
    accessorKey: "header",
    header: "Request",
    cell: ({ row }) => (
      <div className="flex items-center gap-3 text-sm font-bold ">
        <div className="size-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary font-black text-[10px] border border-primary/10">
          {row.original.header.charAt(0)}
        </div>
        {row.original.header}
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="rounded-full px-3 py-0.5 text-[9px] font-black uppercase  border-border/60">
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className={`rounded-full px-3 py-1 text-[9px] font-black uppercase  border border-transparent ${row.original.status === 'Done' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
        }`}>
        {row.original.status === "Done" ? (
          <IconCircleCheckFilled className="size-3 mr-1" />
        ) : (
          <IconLoader className="size-3 mr-1 animate-spin" />
        )}
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "target",
    header: () => <div className="text-right">Units Needed</div>,
    cell: ({ row }) => (
      <div className="text-right font-black text-sm text-foreground tabular-nums opacity-60">
        {row.original.target}
      </div>
    ),
  },
  {
    accessorKey: "reviewer",
    header: "Requester",
    cell: ({ row }) => {
      const isAssigned = row.original.reviewer !== "Assign reviewer";
      return isAssigned ? (
        <div className="text-sm font-bold text-muted-foreground">{row.original.reviewer}</div>
      ) : (
        <Badge variant="secondary" className="px-2 py-0.5 font-black text-[8px] uppercase  opacity-40">Unassigned</Badge>
      );
    },
  },

];

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({ id: row.original.id });
  return (
    <TableRow
      ref={setNodeRef}
      className={`h-20 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors ${isDragging ? "opacity-50 z-10 relative" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function DataTable({ data: initialData }: { data: z.infer<typeof schema>[] }) {
  const [data, setData] = React.useState(() => initialData);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const sortableId = React.useId();
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor), useSensor(KeyboardSensor));
  const dataIds = React.useMemo<UniqueIdentifier[]>(() => data?.map(({ id }) => id) || [], [data]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection, columnFilters, pagination },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const [activeTab, setActiveTab] = React.useState("requests");

  const filteredData = React.useMemo(() => {
    if (activeTab === "requests") return data.filter(d => d.type === "Deployment" || d.type === "Logistics");
    if (activeTab === "verification") return data.filter(d => d.type === "Verification" || d.type === "Audit");
    if (activeTab === "history") return data.filter(d => d.status === "Done");
    return data;
  }, [data, activeTab]);

  const filteredTable = useReactTable({
    ...table.options,
    data: filteredData,
  });

  return (
    <Tabs defaultValue="requests" onValueChange={setActiveTab} className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-black text-foreground tracking-tighter uppercase tabular-nums">Recent Requests</h3>
        </div>
        <TabsList className="rounded-xl border border-border/40 p-1 bg-zinc-100 dark:bg-zinc-900 border-dashed">
          <TabsTrigger value="requests" className="rounded-lg text-[10px] font-black uppercase  px-4">Requests</TabsTrigger>
          <TabsTrigger value="verification" className="rounded-lg text-[10px] font-black uppercase  px-4">Verification</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg text-[10px] font-black uppercase  px-4">Completed</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value={activeTab} className="m-0 space-y-4">
        <div className="rounded-3xl border border-border/40 overflow-hidden bg-white dark:bg-zinc-950 border-dashed">
          <>
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-border/40 h-16">
                {filteredTable.getHeaderGroups().map((group) => (
                  <TableRow key={group.id} className="hover:bg-transparent border-none">
                    {group.headers.map((header) => (
                      <TableHead key={header.id} className="font-black uppercase text-[10px]  text-muted-foreground px-4">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {filteredTable.getRowModel().rows?.length ? (
                  <>
                    {filteredTable.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </>
                ) : (
                  <TableRow><TableCell colSpan={columns.length} className="h-40 text-center font-black uppercase text-[10px]  opacity-20">No matching records found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </>
        </div>


      </TabsContent>
    </Tabs>
  );
}

