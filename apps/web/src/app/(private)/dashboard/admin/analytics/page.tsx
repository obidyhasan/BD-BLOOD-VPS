"use client";

import { useMemo, useState } from "react";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Globe,
  Send,
  TrendingUp,
  Users,
  Droplets,
  Building2,
  Zap,
  Check,
  ChevronsUpDown,
  Search,
  Building,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useGetActivityFeedQuery,
  useGetPlatformStatsQuery,
} from "@/redux/features/analytics/analyticsApi";
import { useGetAllOrganizationsQuery } from "@/redux/features/organizations/organizationsApi";

export default function AdminAnalyticsPage() {
  const [open, setOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState("all");

  const { data: statsData, isLoading: statsLoading } = useGetPlatformStatsQuery();
  const { data: orgsData } = useGetAllOrganizationsQuery({ adminView: true });
  const { data: activityData } = useGetActivityFeedQuery({ limit: 30 });

  const stats = statsData?.data;
  const organizations = orgsData?.data ?? [];
  const auditLogs = activityData?.data ?? [];

  const metrics = useMemo(() => [
    { title: "Fulfilment Rate", value: stats ? `${stats.bloodRequests.fulfilmentRate}%` : "—", trend: "Blood requests", icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Donor Registrations", value: stats ? stats.donors.total.toLocaleString() : "—", trend: "Nationwide", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Blood Requests Served", value: stats ? stats.bloodRequests.fulfilled.toLocaleString() : "—", trend: "Fulfilled", icon: Droplets, color: "text-red-500", bg: "bg-red-500/10" },
    { title: "Humanitarian Impact", value: stats ? stats.content.works.toString() : "—", trend: "Success Stories", icon: Activity, color: "text-primary", bg: "bg-primary/10" },
    { title: "Pending Posts", value: stats ? stats.content.pendingPosts.toString() : "—", trend: "Awaiting review", icon: Activity, color: "text-rose-500", bg: "bg-rose-500/10" },
    { title: "Active Organizations", value: stats ? stats.organizations.total.toLocaleString() : "—", trend: "Verified Hubs", icon: Building2, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Available Donors", value: stats ? stats.donors.available.toLocaleString() : "—", trend: "Ready now", icon: Send, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Geographic Coverage", value: stats ? `${stats.geo.districts} Districts` : "—", trend: stats ? `${stats.geo.upazilas} upazilas` : "Nationwide", icon: Globe, color: "text-primary", bg: "bg-primary/10" },
  ], [stats]);

  const filteredLogs = useMemo(() => {
    if (selectedOrg === "all") return auditLogs;
    return auditLogs.filter((log) => log.org === selectedOrg);
  }, [selectedOrg, auditLogs]);

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <DashboardHeader
          variant="clinical"
          title="Analytics"
          subtitle="Live stats across all organizations and blood supply activity."
          badge="Oversight Console"
        />
      </div>

      {statsLoading ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 animate-pulse border border-border/40 border-dashed" />
          ))}
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {metrics.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="shadow-none rounded-[2.5rem] border-border/40 overflow-hidden hover:shadow-premium transition-all duration-300 group h-full bg-card">
                <CardContent className="p-8 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className={`size-14 rounded-3xl ${m.bg} ${m.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-black/5`}>
                      <m.icon className="size-7" />
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <TrendingUp className="size-3" />
                      <span className="text-[10px] font-black uppercase ">{m.trend}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground  opacity-60 mb-1">{m.title}</p>
                    <p className="text-4xl font-black tracking-tighter">{m.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>
      )}

      {/* Audit Logs Section */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shadow-xl">
              <Terminal className="size-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase">System Audit Logs</h3>
              <p className="text-xs font-medium text-muted-foreground opacity-60">Traceable operational history across the entire network.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="h-12 w-[280px] justify-between rounded-2xl border-border/40 bg-zinc-50/50 dark:bg-zinc-950/50 font-bold text-xs uppercase  px-6"
                >
                  <div className="flex items-center gap-2">
                    <Building className="size-4 text-primary" />
                    {selectedOrg === "all"
                      ? "All Organizations"
                      : organizations.find((org) => org.name === selectedOrg)?.name || selectedOrg}
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0 rounded-2xl border-border/40 shadow-premium overflow-hidden">
                <Command className="bg-white dark:bg-zinc-950">
                  <div className="p-2 border-b border-border/40">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-40" />
                      <CommandInput placeholder="Search organization..." className="h-10 pl-9 border-none focus:ring-0 text-sm font-bold" />
                    </div>
                  </div>
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty className="py-6 text-center text-xs font-bold text-muted-foreground">No organization found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => { setSelectedOrg("all"); setOpen(false); }}
                        className="rounded-xl mx-2 my-1 font-bold text-xs uppercase  cursor-pointer"
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedOrg === "all" ? "opacity-100" : "opacity-0")} />
                        All Organizations
                      </CommandItem>
                      {organizations.map((org) => (
                        <CommandItem
                          key={org.id}
                          value={org.name}
                          onSelect={() => { setSelectedOrg(org.name); setOpen(false); }}
                          className="rounded-xl mx-2 my-1 font-bold text-xs uppercase  cursor-pointer"
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedOrg === org.name ? "opacity-100" : "opacity-0")} />
                          {org.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Card className="rounded-[2.5rem] border-border/40 overflow-hidden shadow-premium bg-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-border/40 h-16">
                    <th className="px-8 font-black uppercase text-[10px]  text-left text-muted-foreground whitespace-nowrap">Timestamp</th>
                    <th className="px-8 font-black uppercase text-[10px]  text-left text-muted-foreground whitespace-nowrap">Organization Node</th>
                    <th className="px-8 font-black uppercase text-[10px]  text-left text-muted-foreground whitespace-nowrap">Operational Activity</th>
                    <th className="px-8 font-black uppercase text-[10px]  text-left text-muted-foreground whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  <AnimatePresence mode="popLayout">
                    {filteredLogs.map((log, i) => (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: i * 0.05 }}
                        className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors h-20"
                      >
                        <td className="px-8">
                          <div className="flex flex-col">
                            <span className="text-xs font-black tracking-tight">{log.date}</span>
                            <span className="text-[10px] font-bold text-muted-foreground opacity-40 uppercase ">Global Sync</span>
                          </div>
                        </td>
                        <td className="px-8">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                              <Building2 className="size-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-sm tracking-tight">{log.org}</span>
                              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase ">Authorized Hub</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8">
                          <div className="flex items-center gap-3">
                            <div className="size-2 rounded-full bg-primary" />
                            <span className="text-sm font-bold text-foreground/80">{log.action}</span>
                          </div>
                        </td>
                        <td className="px-8">
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] border-none shadow-sm",
                              log.status === "Active" ? "bg-amber-500/10 text-amber-500 shadow-amber-500/5" :
                                log.status === "Success" ? "bg-emerald-500/10 text-emerald-500 shadow-emerald-500/5" :
                                  "bg-blue-500/10 text-blue-500 shadow-blue-500/5"
                            )}
                          >
                            {log.status}
                          </Badge>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
