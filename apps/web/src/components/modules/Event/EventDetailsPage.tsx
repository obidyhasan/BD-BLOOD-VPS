"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  Clock3,
  MapPin,
  UsersRound,
  ShieldCheck,
  Activity,
  Megaphone,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "motion/react";
import Image from "next/image";
import {
  useGetEventBySlugQuery,
  useJoinEventMutation,
  type Event,
} from "@/redux/features/events/eventsApi";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { mapApiEvent } from "@/lib/event";
import { extractErrorMessage } from "@/lib/apiError";

const EventDetailsPage = ({
  slug,
  initialEvent,
}: {
  slug: string;
  initialEvent?: Event | null;
}) => {
  const { data, isLoading: loading } = useGetEventBySlugQuery(slug, {
    skip: !slug || !!initialEvent,
  });
  const rawEvent = data?.data ?? initialEvent ?? null;
  const event = useMemo(
    () => (rawEvent ? mapApiEvent(rawEvent) : null),
    [rawEvent],
  );

  const { data: meData } = useGetMeQuery();
  const [joinEvent, { isLoading: isJoining }] = useJoinEventMutation();

  const handleJoinMission = async () => {
    if (!meData?.data) {
      toast.error("Please sign in as a donor to join this event.");
      return;
    }
    if (!rawEvent) return;

    try {
      await joinEvent({
        eventId: rawEvent.id,
        participationType: "VOLUNTEER",
      }).unwrap();
      toast.success("Join request sent!");
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, "Failed to join this event."));
    }
  };

  if (loading && !initialEvent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="size-12 text-primary animate-spin" />
        <p className="text-xs font-black uppercase  opacity-40">
          Loading Event Details...
        </p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <Megaphone className="size-20 text-muted-foreground/20" />
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tighter ">
            Event Not Found
          </h2>
          <p className="text-sm font-medium text-muted-foreground">
            The requested event could not be found.
          </p>
        </div>
        <Link href="/event">
          <Button
            variant="outline"
            className="h-12 px-8 rounded-2xl font-black text-xs uppercase "
          >
            Back to Events
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-10 md:pb-16">
      {/* Cinematic Header Block */}
      <div className="bg-gradient-to-b from-emerald-50/50 to-white pt-28 pb-10">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12"
          >
            {/* Main Briefing Card */}
            <div className="lg:col-span-8">
              <Card className="rounded-[3rem] border-border/40 shadow-premium overflow-hidden bg-white dark:bg-zinc-900 border-none">
                <div className="relative aspect-[16/8] w-full overflow-hidden border-b border-border/40 bg-zinc-100">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <CardContent className="p-8 space-y-10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-muted-foreground uppercase opacity-40">
                        Event Date
                      </p>
                      <p className="flex items-center gap-2 text-xs font-black text-foreground tracking-tight underline decoration-primary/30 decoration-2 underline-offset-4 ">
                        <CalendarDays className="size-4 text-primary" />
                        {event.date}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-muted-foreground uppercase opacity-40">
                        Active Window
                      </p>
                      <p className="flex items-center gap-2 text-xs font-black text-foreground tracking-tight underline decoration-primary/30 decoration-2 underline-offset-4">
                        <Clock3 className="size-4 text-primary" />
                        {event.time}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-muted-foreground uppercase opacity-40">
                        Sector Node
                      </p>
                      <p className="flex items-center gap-2 text-xs font-black text-foreground tracking-tight underline decoration-primary/30 decoration-2 underline-offset-4">
                        <MapPin className="size-4 text-primary" />
                        {event.location}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-muted-foreground uppercase opacity-40">
                        Live Capacity
                      </p>
                      <p className="flex items-center gap-2 text-xs font-black text-foreground tracking-tight underline decoration-primary/30 decoration-2 underline-offset-4">
                        <UsersRound className="size-4 text-primary" />
                        {event.joined}
                      </p>
                    </div>
                  </div>

                  <Separator className="border-dashed" />

                  <div className="space-y-4">
                    <h1 className="text-3xl font-black text-foreground tracking-tighter leading-[0.9] uppercase">
                      {event.title}
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground/60 max-w-2xl">
                      Organized by{" "}
                      <span className="text-foreground font-black uppercase">
                        {event.org}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-8 prose prose-zinc dark:prose-invert max-w-none">
                    <div className="text-lg font-medium text-muted-foreground leading-relaxed space-y-6">
                      <p>
                        {event.description ||
                          "No details are available for this event yet."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => void handleJoinMission()}
                      disabled={isJoining}
                      className="h-16 px-12 rounded-2xl font-black text-xs uppercase tracking-[0.2em]"
                    >
                      {isJoining ? (
                        <Loader2 className="mr-2 size-5 animate-spin" />
                      ) : (
                        <ShieldCheck className="mr-2 size-5" />
                      )}
                      Join Event
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Protocol */}
            <div className="lg:col-span-4 space-y-12">
              <div className="p-10 rounded-[3rem] bg-zinc-900 text-white relative overflow-hidden group shadow-2xl">
                <Activity className="absolute -bottom-6 -right-6 size-48 text-white/5 -rotate-12 transition-transform duration-1000 group-hover:scale-110" />
                <div className="relative z-10 space-y-8">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2 text-primary">
                    <div className="size-2 rounded-full bg-primary animate-pulse" />
                    Live Status
                  </h4>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-[10px] font-black uppercase  opacity-40 ">
                        Total Slots
                      </span>
                      <span className="text-xl font-black tracking-tighter">
                        {event.slots}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full w-[82%] bg-primary rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                        <span className="text-[10px] font-bold uppercase opacity-20">
                          Personnel
                        </span>
                        <p className="text-lg font-black ">
                          {event.joined.split(" ")[0]}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                        <span className="text-[10px] font-bold uppercase opacity-20">
                          Verified
                        </span>
                        <p className="text-lg font-black ">Active</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;
