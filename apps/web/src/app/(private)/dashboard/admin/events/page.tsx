"use client";

import { useState, useMemo } from "react";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Edit3,
  Megaphone,
  MapPin,
  Calendar,
  Clock,
  Users,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import UploadEventModal from "@/components/modules/Admin/Event/UploadEventModal";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetAllEventsQuery,
  useDeleteEventMutation,
} from "@/redux/features/events/eventsApi";
import { format } from "date-fns";

const eventTypeLabel: Record<string, string> = {
  DONATION_CAMP: "Donation Camp",
  WORKSHOP: "Workshop",
  AWARENESS: "Awareness",
  SOCIAL_ACTIVITY: "Social Activity",
  BLOOD_CAMP: "Blood Camp",
};

const getEventHref = (event: { id: string; slug?: string | null }) =>
  `/event/${event.slug || event.id}`;

const getEventLocation = (event: {
  locationDetails?: string | null;
  upazila?: { name: string };
  district?: { name: string };
  division?: { name: string };
}) =>
  [
    event.locationDetails,
    event.upazila?.name,
    event.district?.name,
    event.division?.name,
  ]
    .filter(Boolean)
    .join(", ");

const formatEventDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : format(date, "MMM dd, yyyy");
};

const typeStyle = (t: string) => {
  switch (t) {
    case "DONATION_CAMP":
    case "BLOOD_CAMP":
      return "bg-red-500/10 text-red-500";
    case "AWARENESS":
      return "bg-primary/10 text-primary";
    case "WORKSHOP":
      return "bg-blue-500/10 text-blue-500";
    case "SOCIAL_ACTIVITY":
      return "bg-emerald-500/10 text-emerald-500";
    default:
      return "bg-zinc-500/10 text-zinc-500";
  }
};

export default function AdminEventsPage() {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { data, isLoading } = useGetAllEventsQuery({ limit: 200 });
  const [deleteEvent] = useDeleteEventMutation();

  const events = data?.data ?? [];

  const filteredEvents = useMemo(() => {
    let result = events.filter(
      (e) =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.locationDetails || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        eventTypeLabel[e.eventType]
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()),
    );

    result = [...result].sort((a, b) => {
      const dateA = new Date(a.eventDate).getTime();
      const dateB = new Date(b.eventDate).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [events, searchQuery, sortOrder]);

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEvents.slice(start, start + itemsPerPage);
  }, [filteredEvents, currentPage]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEvent(deleteTarget).unwrap();
      toast.success("Event removed successfully");
    } catch {
      toast.error("Failed to delete event");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-2">
        <DashboardHeader
          variant="clinical"
          title="All Events"
          subtitle="Plan and track community blood drives and awareness events."
          badge="Deployment Hub"
        />
        <div className="flex gap-4">
          <div className="py-1 px-4 rounded-3xl bg-white dark:bg-zinc-900 border border-border/40 flex items-center gap-4">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Megaphone className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40">
                Active Missions
              </p>
              <p className="text-xl font-black  tracking-tighter">
                {filteredEvents.length}
              </p>
            </div>
          </div>
          <UploadEventModal onSuccess={() => setCurrentPage(1)} />
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search missions, locations, or types..."
            className="h-14 pl-12 rounded-2xl shadow-none bg-white dark:bg-zinc-900/50 border border-border/40 font-bold"
          />
        </div>
        <Select
          value={sortOrder}
          onValueChange={(v) => {
            setSortOrder(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-max min-w-48 py-7 rounded-2xl shadow-none bg-white dark:bg-zinc-900 border border-border/40 font-black text-xs uppercase px-6">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40">
            <SelectItem value="newest" className="font-bold">
              Newest First
            </SelectItem>
            <SelectItem value="oldest" className="font-bold">
              Oldest First
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Event Grid */}
      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-112.5 rounded-[3rem] bg-zinc-50 dark:bg-zinc-900 animate-pulse border-4 border-white"
            />
          ))}

        {!isLoading && paginatedEvents.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-40">
            <Megaphone className="size-16 mb-4 stroke-1" />
            <p className="text-xl font-black uppercase">No Events Found</p>
            <p className="text-xs font-bold mt-1">
              Try adjusting your filters or search query.
            </p>
          </div>
        )}

        {!isLoading &&
          paginatedEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group h-full flex flex-col"
            >
              <div className="relative border border-border/40 rounded-4xl overflow-hidden bg-white dark:bg-zinc-900 hover:shadow-premium transition-all duration-700 flex flex-col flex-1">
                {/* Type badge */}
                <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-b border-border/40 flex items-center justify-center">
                  <Megaphone className="size-12 text-muted-foreground opacity-10" />
                  <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                    <Link href={getEventHref(event)}>
                      <Button
                        size="icon"
                        className="size-12 rounded-2xl bg-white text-zinc-950 hover:bg-primary hover:text-white shadow-xl transition-all"
                      >
                        <Eye className="size-5" />
                      </Button>
                    </Link>
                    <UploadEventModal
                      event={event}
                      trigger={
                        <Button
                          size="icon"
                          className="size-12 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-900 hover:text-white shadow-xl transition-all"
                        >
                          <Edit3 className="size-5" />
                        </Button>
                      }
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="size-12 rounded-2xl shadow-xl bg-red-500 hover:bg-red-600 transition-all"
                      onClick={() => setDeleteTarget(event.id)}
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  </div>
                  <div className="absolute top-4 left-4">
                    <Badge
                      variant="secondary"
                      className={`px-4 py-1.5 rounded-full font-black uppercase text-[9px]  shadow-xl border-none ${typeStyle(event.eventType)}`}
                    >
                      {eventTypeLabel[event.eventType] || event.eventType}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6 flex flex-col flex-1">
                  <div className="space-y-4 flex-1">
                    <h3 className="text-2xl font-black text-foreground tracking-tighter leading-[1.1] group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/10 border-dashed">
                      <div className="flex items-center gap-3 text-muted-foreground font-black text-[9px] uppercase  opacity-60">
                        <Calendar className="size-4 text-primary/60" />
                        {formatEventDate(event.eventDate)}
                      </div>
                      {event.eventTime && (
                        <div className="flex items-center gap-3 text-muted-foreground font-black text-[9px] uppercase  opacity-60">
                          <Clock className="size-4 text-primary/60" />
                          {event.eventTime}
                        </div>
                      )}
                      {getEventLocation(event) && (
                        <div className="flex items-center gap-3 text-muted-foreground font-black text-[9px] uppercase  opacity-60 col-span-2">
                          <MapPin className="size-4 text-primary/60" />
                          {getEventLocation(event)}
                        </div>
                      )}
                      {event.organization?.name && (
                        <div className="flex items-center gap-3 text-muted-foreground font-black text-[9px] uppercase  opacity-60 col-span-2">
                          <Megaphone className="size-4 text-primary/60" />
                          {event.organization.name}
                        </div>
                      )}
                      {event._count && (
                        <div className="flex items-center gap-3 text-muted-foreground font-black text-[9px] uppercase  opacity-60">
                          <Users className="size-4 text-primary/60" />
                          {event._count.participants} Participants
                        </div>
                      )}
                      {event.slots && (
                        <div className="flex items-center gap-3 text-muted-foreground font-black text-[9px] uppercase  opacity-60">
                          <Users className="size-4 text-primary/60" />
                          {event.slots}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">
            Page {currentPage} of {totalPages} · {filteredEvents.length}{" "}
            missions
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase hover:bg-zinc-950 hover:text-white transition-all"
            >
              <ChevronLeft className="size-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase hover:bg-zinc-950 hover:text-white transition-all"
            >
              Next
              <ChevronRight className="size-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-[2.5rem] border-border/40 p-8 max-w-md">
          <AlertDialogHeader className="space-y-4">
            <div className="size-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <AlertCircle className="size-7" />
            </div>
            <div>
              <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">
                Confirm Abort
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm font-medium text-muted-foreground/60 leading-relaxed">
                Are you sure you want to permanently abort this mission? All
                deployment data will be purged.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-4 mt-8">
            <AlertDialogCancel asChild>
              <Button
                variant="outline"
                className="h-12 rounded-2xl font-black text-[10px] uppercase  border-border/40"
              >
                Keep Mission
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                onClick={confirmDelete}
                className="h-12 rounded-2xl font-black text-[10px] uppercase  bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/20 transition-all"
              >
                Abort Now
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
