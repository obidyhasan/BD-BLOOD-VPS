"use client";

import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { useOrganizationDashboardContext } from "@/hooks/useOrganizationDashboardContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, Activity, Globe, Send, TrendingUp, } from "lucide-react";

import { motion } from "motion/react";

import {
  useGetActivityFeedQuery,
  useGetOrganizationStatsQuery,
} from "@/redux/features/analytics/analyticsApi";

const SystemAnalyticsPage = () => {
  const { organizationId: orgId } = useOrganizationDashboardContext();
  const { data: statsData } = useGetOrganizationStatsQuery(
    orgId ? { organizationId: orgId } : undefined,
    { skip: !orgId },
  );
  const { data: activityData } = useGetActivityFeedQuery(
    orgId ? { limit: 10, organizationId: orgId } : undefined,
    { skip: !orgId },
  );
  const stats = statsData?.data;
  const logs = activityData?.data ?? [];

  const summary = [
    { title: "Active Members", value: `${stats?.members ?? 0} Active Profiles`, icon: MapPin, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Blood Request Volume", value: `${stats?.pendingRequests ?? 0} Pending Requests`, icon: Activity, color: "text-red-500", bg: "bg-red-500/10" },
    { title: "Blood Reserve", value: `${stats?.inventoryUnits ?? 0} Units Available`, icon: Globe, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Pending Posts", value: `${stats?.pendingPosts ?? 0} Awaiting Review`, icon: Send, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <DashboardHeader
        variant="clinical"
        title="Control Center"
        subtitle="Live stats on donors, organization activity, and messages."
        badge="Live Analytics"
      />


      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
        {summary.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="rounded-[2rem] border-border/40 overflow-hidden shadow-none hover:shadow-premium transition-all duration-300 bg-card group h-full">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className={`size-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <item.icon className="size-6" />
                  </div>
                  <TrendingUp className="size-4 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground  opacity-60">{item.title}</p>
                  <p className="text-xl font-black text-foreground tracking-tight leading-tight">{item.value}</p>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">

            <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase">Audit Logs</h3>
          </div>
          <button className="text-xs font-black uppercase  text-primary hover:underline">Download CSV</button>
        </div>

        <Card className="rounded-[2.5rem] border-border/40 overflow-hidden shadow-none bg-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-border/40">
                <TableRow className="hover:bg-transparent px-8">
                  <TableHead className="px-8 font-black uppercase text-[10px]  h-16">Timestamp</TableHead>

                  <TableHead className="font-black uppercase text-[10px]  h-16">Operational Activity</TableHead>
                  <TableHead className="font-black uppercase text-[10px]  h-16 text-right px-8">Platform Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="px-8 py-12 text-center text-sm font-bold text-muted-foreground">
                      No activity recorded for your organization yet.
                    </TableCell>
                  </TableRow>
                )}
                {logs.map((item) => (
                  <TableRow key={item.id} className="h-20 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <TableCell className="px-8 text-sm font-bold text-muted-foreground">{item.date}</TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">{item.action}</span>
                        <span className="text-[10px] font-black text-muted-foreground uppercase opacity-40">{item.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <Badge className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase  ${item.status === "FULFILLED" || item.status === "VERIFIED" || item.status === "APPROVED" || item.status === "Success" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                        }`}>
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>


    </div>
  );
};

export default SystemAnalyticsPage;
