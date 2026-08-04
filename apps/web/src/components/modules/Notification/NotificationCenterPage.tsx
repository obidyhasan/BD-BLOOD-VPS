"use client";

import Link from "next/link";

import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  History,
  Droplets,
  Building2,
  Calendar,
  Settings,
  ShieldCheck,
  Eye,
  Inbox,
  User,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  useGetMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useDeleteNotificationMutation,
  type Notification,
} from "@/redux/features/notifications/notificationsApi";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";

type DisplayNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  priority: string;
  time: string;
  organizationName?: string;
  organizationSlug?: string;
  donorName?: string;
  donorSlug?: string;
};

function mapNotification(n: Notification): DisplayNotification {
  const type = n.type === "BLOOD_REQUEST" ? "BLOOD" : n.type;
  return {
    id: n.id,
    title: n.title,
    body: n.message,
    type,
    read: n.isRead,
    priority: n.priority === "HIGH" ? "high" : "medium",
    time: formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }),
  };
}
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";

// --- Helpers ---
const typeIcons: Record<string, LucideIcon> = {
  BLOOD: Droplets,
  ORG: Building2,
  POST: Calendar,
  ADMIN: Settings,
  SYSTEM: ShieldCheck,
  EVENT: Calendar,
};

const typeColors: Record<string, string> = {
  BLOOD: "bg-red-500/10 text-red-500 border-red-500/20",
  ORG: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  POST: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  ADMIN: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  SYSTEM: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  EVENT: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

const NotificationItem = ({
  n,
  i,
  isSmall = false,
  isAdmin = false,
  onRead,
  onDelete,
}: {
  n: DisplayNotification;
  i: number;
  isSmall?: boolean;
  isAdmin?: boolean;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const Icon = typeIcons[n.type] || Bell;
  const isHighPriority = n.priority === "high";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: i * 0.05 }}
    >
      <div
        className={cn(
          "rounded-[2.5rem] p-6 border-2 border-dashed transition-all duration-300 group relative flex items-start gap-5",
          !n.read
            ? "bg-card border-primary/20 shadow-premium cursor-pointer"
            : "bg-zinc-50/50 dark:bg-zinc-950/50 border-border/40 opacity-70 hover:opacity-100",
          isSmall && "p-4 gap-3 rounded-[2rem]",
        )}
      >
        <div
          className={cn(
            "rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-sm",
            isSmall ? "size-10" : "size-14",
            !n.read
              ? isHighPriority
                ? "bg-red-500 text-white shadow-red-500/20"
                : "bg-primary text-white shadow-primary/20"
              : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground",
          )}
        >
          <Icon className={isSmall ? "size-5" : "size-6"} />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge
                className={cn(
                  "rounded-full px-3 py-0.5 font-black uppercase",
                  isSmall ? "text-[6px] px-2" : "text-[8px]",
                  typeColors[n.type] || "",
                )}
              >
                {n.type}
              </Badge>
              <span className="text-[9px] font-bold text-muted-foreground opacity-40 uppercase flex items-center gap-1">
                <Clock className="size-2.5" />
                {n.time}
              </span>
            </div>
            {!n.read && (
              <div className="size-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>

          <div className="space-y-1">
            <h4
              className={cn(
                "font-black tracking-tighter leading-tight transition-colors",
                isSmall ? "text-sm" : "text-lg",
                !n.read ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {n.title}
            </h4>
            {!isSmall && (
              <p className="text-sm font-medium text-muted-foreground line-clamp-2 leading-relaxed">
                {n.body}
              </p>
            )}

            {isAdmin && (n.organizationName || n.donorName) && (
              <div className="pt-2 flex flex-wrap items-center gap-2">
                {n.organizationName && (
                  <Link
                    href={`/organization/${n.organizationSlug}`}
                    className="text-[9px] font-black uppercase text-primary/80 flex items-center gap-1.5 bg-primary/5 px-3 py-1 rounded-full border border-primary/10 transition-colors"
                  >
                    <Building2 className="size-3" />
                    {n.organizationName}
                    <ExternalLink className="size-2.5 opacity-40" />
                  </Link>
                )}
                {n.donorName && (
                  <Link
                    href={`/donor/${n.donorSlug}`}
                    className="text-[9px] font-black uppercase text-emerald-500 flex items-center gap-1.5 bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10 transition-colors"
                  >
                    <User className="size-3" />
                    {n.donorName}
                    <ExternalLink className="size-2.5 opacity-40" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {!isSmall && (
            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {!n.read && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-9 rounded-xl text-primary hover:bg-primary/10"
                  onClick={() => {
                    onRead(n.id);
                    toast.success("Marked as read");
                  }}
                >
                  <Eye className="size-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="size-9 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                onClick={() => {
                  onDelete(n.id);
                  toast.success("Removed");
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const NotificationCenterPage = ({
  extraActions,
  title = "Notifications",
  subtitle = "See all your messages and alerts here.",
  isAdmin = false,
}: {
  extraActions?: React.ReactNode;
  title?: string;
  subtitle?: string;
  isAdmin?: boolean;
}) => {
  useNotificationSocket();
  const { data, isLoading: loading } = useGetMyNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const notifications = useMemo(
    () => (data?.data ?? []).map(mapNotification),
    [data],
  );

  const handleRead = async (id: string) => {
    try {
      await markRead({ id, isRead: true }).unwrap();
    } catch {
      toast.error("Failed to mark notification.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id).unwrap();
    } catch {
      toast.error("Failed to delete notification.");
    }
  };

  const filteredUnseen = useMemo(() => {
    return notifications.filter((item) => {
      if (item.read) return false;

      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.body.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === "All" || item.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [notifications, searchQuery, typeFilter]);

  const seenMessages = useMemo(() => {
    return notifications.filter((n) => n.read);
  }, [notifications]);

  const table = useReactTable({
    data: filteredUnseen,
    columns: [{ id: "card", accessorKey: "id" }],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const highPriorityCount = notifications.filter(
    (n) => !n.read && n.priority === "high",
  ).length;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <DashboardHeader
          variant="clinical"
          title={title}
          subtitle={subtitle}
          badge={`${unreadCount} Unread`}
        />
        {extraActions && (
          <div className="flex items-center gap-4">{extraActions}</div>
        )}
      </div>

      {loading ? (
        <div className="pt-20 flex flex-col items-center justify-center gap-4">
          <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs font-black uppercase">
            Loading messages...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Column: Filtered List */}
          <div className="lg:col-span-2 space-y-8">
            {/* Control Bar */}
            <div className="flex gap-4">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages..."
                  className="h-14 pl-12 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border-border/40 focus-visible:ring-2 focus-visible:ring-primary/20 font-bold border"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="border rounded-xl w-full py-7 flex-1 dark:bg-zinc-950/50 font-black text-[10px] uppercase px-6">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/40 shadow-premium">
                  <SelectItem
                    value="All"
                    className="font-bold rounded-lg my-1 text-xs px-4"
                  >
                    All Types
                  </SelectItem>
                  {["BLOOD", "ORG", "POST", "ADMIN", "SYSTEM", "EVENT"].map(
                    (type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="font-bold rounded-lg my-1 text-xs px-4 uppercase"
                      >
                        {type}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {table.getRowModel().rows.length > 0 ? (
                  table
                    .getRowModel()
                    .rows.map((row, i) => (
                      <NotificationItem
                        key={row.original.id}
                        n={row.original}
                        i={i}
                        isAdmin={isAdmin}
                        onRead={handleRead}
                        onDelete={handleDelete}
                      />
                    ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-64 rounded-[3rem] border-2 border-dashed border-border/20 flex flex-col items-center justify-center text-center space-y-4 opacity-40"
                  >
                    <Inbox className="size-10" />
                    <p className="font-black text-xs uppercase">
                      No new messages found
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pagination */}
              {filteredUnseen.length > 0 && (
                <div className="flex items-center justify-between px-2">
                  <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount()} · {filteredUnseen.length} new
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
              )}
            </div>
          </div>

          {/* Side Column: Recent History */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 text-muted-foreground">
                <History className="size-4 opacity-40" />
                History
              </h2>
            </div>

            <div className="space-y-4">
              {seenMessages.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-border/10 rounded-[2.5rem] opacity-30 text-[10px] font-black uppercase">
                  No Seen Messages
                </div>
              ) : (
                <div className="space-y-3">
                  {seenMessages.map((n, i) => (
                    <NotificationItem
                      key={n.id}
                      n={n}
                      i={i}
                      isSmall={true}
                      isAdmin={isAdmin}
                      onRead={handleRead}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenterPage;
