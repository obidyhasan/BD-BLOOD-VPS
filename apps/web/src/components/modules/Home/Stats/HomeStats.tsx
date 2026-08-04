"use client"

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { homeStatsConfig, formatStatCount } from "@/lib/siteContent";
import { useGetPublicStatsQuery } from "@/redux/features/analytics/analyticsApi";

const HomeStats = () => {
  const { data } = useGetPublicStatsQuery();
  const live = data?.data;

  const trendLabels: Record<string, string> = live
    ? {
      donors: `${live.donorsAvailable} available`,
      fulfilled: `${live.fulfilmentRate}% fulfilled`,
      orgs: `${live.verifiedOrganizations} verified`,
      districts: `${live.districtsCovered} districts`,
    }
    : {};

  const valueLabels: Record<string, string> = live
    ? {
      donors: formatStatCount(live.donorsTotal),
      fulfilled: formatStatCount(live.fulfilledRequests),
      orgs: formatStatCount(live.verifiedOrganizations),
      districts: String(live.districtsCovered),
    }
    : {};

  const stats = homeStatsConfig.map((s) => ({
    ...s,
    value: valueLabels[s.trendKey] ?? "—",
    trend: trendLabels[s.trendKey] ?? "—",
  }));

  return (
    <div className="py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Card className="rounded-4xl border-primary/5 bg-white dark:bg-zinc-900/50 shadow-sm hover:shadow-xl transition-all duration-300 border overflow-hidden group">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className={`size-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center border border-primary/5 group-hover:scale-110 transition-transform`}>
                    <stat.icon className="size-5" />
                  </div>
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-[8px] font-black uppercase  border-primary/10 bg-primary/5 text-primary">
                    {stat.trend}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground  opacity-40">
                    {stat.label}
                  </p>
                  <h3 className="text-4xl font-black tracking-tighter text-foreground uppercase  leading-none group-hover:text-primary transition-colors">{stat.value}</h3>
                  <p className="text-xs font-medium text-muted-foreground  leading-relaxed opacity-80 pt-2">
                    {stat.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="mt-12 p-8 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 border border-primary/5 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-sm"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/10 shadow-inner group transition-transform hover:rotate-3">
            <ShieldCheck className="size-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xl font-black text-foreground uppercase  tracking-tight leading-none">Security Protocol Verified</h4>
            <p className="text-sm text-muted-foreground font-medium  opacity-70">&apos;Your donation data is protected with military-grade encryption&apos;</p>
          </div>
        </div>
        <button className="h-12 px-6 rounded-xl bg-primary text-white text-[10px] font-black uppercase  hover:bg-emerald-600 transition-all shadow-lg shadow-primary/20 relative z-10">
          Privacy Protocol
        </button>
      </motion.div>
    </div>
  );
};

export default HomeStats;
