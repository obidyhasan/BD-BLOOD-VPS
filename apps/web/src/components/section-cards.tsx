"use client";

import { Users, HeartPulse, Droplets, Clock, Activity, Zap, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "motion/react";

import { useGetOrganizationStatsQuery } from "@/redux/features/analytics/analyticsApi";

export function SectionCards() {
  const { data: statsData } = useGetOrganizationStatsQuery();
  const orgStats = statsData?.data;

  const counts = {
    donors: orgStats?.members ?? 0,
    requests: orgStats?.pendingRequests ?? 0,
    inventory: orgStats?.inventoryUnits ?? 0,
    pendingPosts: orgStats?.pendingPosts ?? 0,
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
      label: "Blood Reserve",
      val: counts.inventory.toString(),
      trend: "Optimal",
      trendIcon: Droplets,
      sub: "Available blood units",
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
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
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
