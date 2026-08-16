"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Droplets, Heart, Users } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";

interface ProfileStatsProps {
  memberCount?: number;
  workCount?: number;
  activeDonors?: number;
  requestsFulfilled?: number;
  verifiedDonations?: number;
}

const ProfileStats = ({ memberCount = 0, workCount = 0, activeDonors = 0, requestsFulfilled = 0, verifiedDonations = 0 }: ProfileStatsProps) => {
  const stats = useMemo(() => [
    { label: "Active Donors", value: activeDonors, trend: "Local", icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Requests Fulfilled", value: requestsFulfilled, trend: "Local", icon: Droplets, color: "text-primary", bg: "bg-primary/10" },
    { label: "Team Members", value: memberCount, trend: "Team", icon: Heart, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Verified Donations", value: verifiedDonations, trend: `${workCount} works`, icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10" },
  ], [activeDonors, memberCount, requestsFulfilled, verifiedDonations, workCount]);

  return (
    <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }}>
          <Card className="overflow-hidden rounded-[2.5rem] border-dashed border-border/40 bg-white shadow-none transition-all hover:shadow-premium dark:bg-zinc-900">
            <CardHeader className="p-8">
              <div className="flex items-center justify-between">
                <div className={`flex size-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}><stat.icon className="size-6" /></div>
                <Badge variant="outline" className="rounded-xl px-3 py-1 text-[10px] font-black uppercase">{stat.trend}</Badge>
              </div>
              <div className="space-y-1 pt-6">
                <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{stat.label}</CardDescription>
                <CardTitle className="text-4xl font-black leading-none tracking-tighter">{stat.value}</CardTitle>
              </div>
            </CardHeader>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default ProfileStats;
