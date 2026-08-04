"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CalendarDays,
  MapPin,
  UsersRound,
  Megaphone,
  ArrowRight,
  Search,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader/PageHeader";
import { useGetAllEventsQuery } from "@/redux/features/events/eventsApi";
import { mapApiEvent } from "@/lib/event";
import type { Event } from "@/redux/features/events/eventsApi";

type EventsListResponse = {
  success?: boolean;
  data?: Event[];
};

type EventsPageProps = {
  initialData?: EventsListResponse;
};

const EventsPage = ({ initialData }: EventsPageProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(6);

  const { data, isLoading } = useGetAllEventsQuery(
    { limit: 100 },
    { skip: !!initialData?.data?.length },
  );
  const events = useMemo(
    () => (initialData?.data ?? data?.data ?? []).map(mapApiEvent),
    [initialData, data],
  );
  const loading = !initialData?.data?.length && isLoading;

  const filteredEvents = useMemo(() => {
    const result = events.filter(
      (e) =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.type.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [events, searchQuery, sortOrder]);

  const paginatedEvents = useMemo(() => {
    return filteredEvents.slice(0, visibleCount);
  }, [filteredEvents, visibleCount]);

  return (
    <div className="min-h-screen bg-white pb-10 md:pb-16">
      <PageHeader
        icon={<Megaphone className="size-3.5" />}
        badgeText="Community Events"
        titleBase="Upcoming"
        titleSpan="Blood"
        titleSuffix="Events"
        description="Join donation camps, workshops, and awareness drives organized by verified blood organizations across Bangladesh."
      />

      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="pl-12 h-14 rounded-2xl border-border/40 focus:border-primary transition-all text-base"
            />
          </div>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="py-6 bg-zinc-50 dark:bg-zinc-950 border border-primary/5 rounded-2xl px-5 text-sm font-bold min-w-[180px]">
              <SelectValue placeholder="Sort by Newest" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="rounded-[2.5rem] border-border/40 overflow-hidden hover:shadow-premium transition-all duration-500 group h-full flex flex-col">
                  <CardContent className="p-8 flex flex-col flex-1 space-y-6">
                    <div className="flex items-center justify-between">
                      <Badge className="rounded-full px-4 py-1 text-[10px] font-black uppercase  bg-primary/10 text-primary border-primary/20">
                        {event.type}
                      </Badge>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                        <UsersRound className="size-3" />
                        {event.slots}
                      </div>
                    </div>
                    <div className="space-y-2 flex-1">
                      <h3 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    </div>
                    <div className="space-y-2 pt-4 border-t border-border/40">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <CalendarDays className="size-4 text-primary" />
                        {new Date(event.date).toLocaleDateString()}
                        {event.time ? ` • ${event.time}` : ""}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <MapPin className="size-4 text-primary" />
                        {event.location}
                      </div>
                    </div>
                    <Link href={`/event/${event.slug}`}>
                      <Button className="w-full h-12 rounded-2xl font-black text-xs uppercase  gap-2 group-hover:bg-primary">
                        View Details
                        <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && visibleCount < filteredEvents.length && (
          <div className="flex justify-center">
            <Button
              onClick={() => setVisibleCount((c) => c + 6)}
              className="h-14 px-10 rounded-2xl font-black text-xs uppercase "
            >
              Load More Events
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
