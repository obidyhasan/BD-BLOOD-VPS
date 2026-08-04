"use client";

import { Badge } from "@/components/ui/badge";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@/components/ui/card";
import { Users, Droplets, Heart, Activity } from "lucide-react";
import { motion } from "motion/react";

import { useMemo } from "react";
import { useGetPlatformStatsQuery } from "@/redux/features/analytics/analyticsApi";

interface ProfileStatsProps {
   memberCount?: number;
   workCount?: number;
}

const ProfileStats = ({ memberCount = 0, workCount = 0 }: ProfileStatsProps) => {
   const { data: platformData } = useGetPlatformStatsQuery();

   const stats = useMemo(() => {
      const platform = platformData?.data;
      return [
         {
            label: "Active Donors",
            value: platform?.donors.available ?? "—",
            trend: "Network",
            sub: "Platform-wide availability",
            icon: Users,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
         },
         {
            label: "Requests Fulfilled",
            value: platform?.bloodRequests.fulfilled ?? "—",
            trend: `${platform?.bloodRequests.fulfilmentRate ?? 0}%`,
            sub: "Emergency response rate",
            icon: Droplets,
            color: "text-primary",
            bg: "bg-primary/10",
         },
         {
            label: "Team Members",
            value: memberCount,
            trend: "Team",
            sub: "Active members on profile",
            icon: Heart,
            color: "text-red-500",
            bg: "bg-red-500/10",
         },
         {
            label: "Featured Work",
            value: workCount,
            trend: "Works",
            sub: "Featured organization works",
            icon: Activity,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
         },
      ];
   }, [platformData, memberCount, workCount]);

   return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
         {stats.map((stat, i) => (
            <motion.div
               key={stat.label}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.1 }}
            >
               <Card className="rounded-[2.5rem] border-border/40 overflow-hidden shadow-none hover:shadow-premium transition-all duration-500 bg-white dark:bg-zinc-900 group border-dashed">
                  <CardHeader className="p-8">
                     <div className="flex items-center justify-between">
                        <div className={`size-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl`}>
                           <stat.icon className="size-6" />
                        </div>
                        <Badge variant="outline" className="rounded-xl px-3 py-1 text-[10px] font-black uppercase 60">
                           {stat.trend}
                        </Badge>
                     </div>
                     <div className="pt-6 space-y-1">
                        <CardDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] opacity-40 leading-none">
                           {stat.label}
                        </CardDescription>
                        <CardTitle className="text-4xl font-black text-foreground tracking-tighter  leading-none">
                           {stat.value}
                        </CardTitle>
                     </div>
                  </CardHeader>
               </Card>
            </motion.div>
         ))}
      </div>
   );
};

export default ProfileStats;
