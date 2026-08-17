"use client";

import { Users, HeartPulse, Droplets, Clock, Activity, Zap, ShieldCheck, Star, BadgeCheck, FileClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

import { useGetOrganizationStatsQuery } from "@/redux/features/analytics/analyticsApi";

export function SectionCards({ organizationId }: { organizationId?: string }) {
  const { data: statsData, isError, refetch } = useGetOrganizationStatsQuery(
    organizationId ? { organizationId } : undefined,
    { skip: !organizationId },
  );
  const orgStats = statsData?.data;

  const counts = {
    donors: orgStats?.activeDonors ?? 0,
    requests: orgStats?.pendingRequests ?? 0,
    inventory: orgStats?.inventoryUnits ?? 0,
    fulfilled: orgStats?.fulfilledRequests ?? 0,
    pendingPosts: orgStats?.pendingPosts ?? 0,
    pendingContent: orgStats?.pendingContentApprovals ?? 0,
  };

  const cardStats = [
    {
      label: "Active Requests",
      val: counts.requests.toString(),
      trend: counts.requests > 0 ? "Needs action" : "Clear",
      trendIcon: Activity,
      sub: "Urgent blood needs",
      icon: HeartPulse,
      color: "text-red-500",
      bg: "bg-red-500/10",
      glow: "shadow-red-500/20"
    },
    {
      label: "Verified Donors",
      val: counts.donors.toLocaleString(),
      trend: "Active roster",
      trendIcon: ShieldCheck,
      sub: "Total active donors",
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      glow: "shadow-emerald-500/20"
    },
    {
      label: "Available Donors",
      val: counts.inventory.toString(),
      trend: "Optimal",
      trendIcon: Droplets,
      sub: "Eligible affiliated donors",
      icon: Zap,
      color: "text-primary",
      bg: "bg-primary/10",
      glow: "shadow-primary/20"
    },
    {
      label: "Pending Posts",
      val: counts.pendingPosts.toString(),
      trend: counts.pendingPosts > 0 ? "Review" : "Clear",
      trendIcon: Star,
      sub: "Awaiting approval",
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      glow: "shadow-amber-500/20"
    },
    {
      label: "Fulfilled Requests",
      val: counts.fulfilled.toString(),
      trend: "Completed",
      trendIcon: BadgeCheck,
      sub: "Fulfilled request lifecycle",
      icon: BadgeCheck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      glow: "shadow-blue-500/20"
    },
    {
      label: "Content Approvals",
      val: counts.pendingContent.toString(),
      trend: counts.pendingContent > 0 ? "Admin review" : "Clear",
      trendIcon: FileClock,
      sub: "Blogs, events and galleries",
      icon: FileClock,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      glow: "shadow-violet-500/20"
    }
  ];

  if (isError) {
    return <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-[2rem] border border-dashed border-destructive/30"><p className="text-sm font-semibold text-destructive">Overview statistics could not be loaded.</p><Button variant="outline" onClick={() => void refetch()}>Try again</Button></div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {cardStats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="h-full"
        >
          <div className="rounded-[3rem] border-border/40 overflow-hidden shadow-none hover:shadow-premium transition-all duration-500 bg-card group relative h-full border-dashed">
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} rounded-full blur-3xl -mr-16 -mt-16 transition-opacity opacity-0 group-hover:opacity-100`} />

            <CardHeader className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className={`size-16 rounded-[1.5rem] ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl ${stat.glow}`}>
                  <stat.icon className="size-8" />
                </div>
                <Badge variant="outline" className="rounded-xl px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] border-border/60 bg-background/50 backdrop-blur-sm">
                  {stat.trend}
                </Badge>
              </div>
              <CardDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] opacity-40 leading-none">
                {stat.label}
              </CardDescription>
              <CardTitle className="text-5xl font-black text-foreground tracking-tighter mt-2 tabular-nums">
                {stat.val}
              </CardTitle>
            </CardHeader>

            <CardFooter className="px-8 pb-8 pt-0 flex flex-col items-start gap-2">
              <div className="flex items-center gap-2 font-black text-[10px] text-muted-foreground uppercase  opacity-40">
                <stat.trendIcon className={`size-3 ${stat.color}`} />
                {stat.sub}
              </div>
            </CardFooter>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
