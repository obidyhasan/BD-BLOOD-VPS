"use client";

import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Building2,
  Droplets,
  FileText,
  Activity,
  Globe,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import {
  useGetActivityFeedQuery,
  useGetPlatformStatsQuery,
} from "@/redux/features/analytics/analyticsApi";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

// recharts is a substantial dependency; deferring it out of the initial
// bundle for this route means the dashboard shell (stats cards, activity
// feed) can render and become interactive before the chart JS even loads.
const ChartAreaInteractive = dynamic(
  () =>
    import("@/components/chart-area-interactive").then(
      (mod) => mod.ChartAreaInteractive,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[350px] w-full animate-pulse rounded-3xl bg-muted/50" />
    ),
  },
);


export default function AdminDashboardPage() {
  const { data: statsData, isLoading } = useGetPlatformStatsQuery();
  const { data: activityData } = useGetActivityFeedQuery({ limit: 5 });
  const s = statsData?.data;

  const stats = [
    {
      label: "Total Donors",
      val: s ? s.donors.total.toLocaleString() : "—",
      change: `${s ? s.donors.available : "—"} available`,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/dashboard/admin/donors",
    },
    {
      label: "Organizations",
      val: s ? s.organizations.total.toString() : "—",
      change: `${s ? s.organizations.verified : "—"} verified`,
      icon: Building2,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      href: "/dashboard/admin/organizations",
    },
    {
      label: "Active Requests",
      val: s ? s.bloodRequests.pending.toString() : "—",
      change: "Pending",
      icon: Droplets,
      color: "text-red-500",
      bg: "bg-red-500/10",
      href: "/dashboard/admin/blood-requests",
    },
    {
      label: "Pending Posts",
      val: s ? s.content.pendingPosts.toString() : "—",
      change: "Awaiting Review",
      icon: FileText,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      href: "/dashboard/admin/posts",
    },
    {
      label: "Success Stories",
      val: s ? s.content.works.toString() : "—",
      change: "Humanitarian Work",
      icon: ShieldCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      href: "/dashboard/admin/work",
    },
    {
      label: "Total Donations",
      val: s ? s.donations.total.toString() : "—",
      change: `${s ? s.donations.verified : "—"} verified`,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      href: "/dashboard/admin/donations",
    },
    {
      label: "Active Events",
      val: s ? s.content.events.toString() : "—",
      change: "Nationwide",
      icon: Activity,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/dashboard/admin/events",
    },
    {
      label: "Coverage",
      val: s ? `${s.geo.districts} Districts` : "—",
      change: s ? `${s.geo.upazilas} upazilas` : "Coverage",
      icon: Globe,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/dashboard/admin/analytics",
    },
  ];

  const recentActivity = (activityData?.data ?? []).map((item) => ({
    action: item.action,
    org: item.org,
    time: formatRelativeTime(item.createdAt),
    type: item.type.toLowerCase(),
  }));

  const quickLinks = [
    {
      label: "Verify Org",
      href: "/dashboard/admin/organizations",
      icon: Building2,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Blood Requests",
      href: "/dashboard/admin/blood-requests",
      icon: Droplets,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      label: "View Donors",
      href: "/dashboard/admin/donors",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Work Hub",
      href: "/dashboard/admin/work",
      icon: ShieldCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Analytics",
      href: "/dashboard/admin/analytics",
      icon: BarChart3,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      label: "Notifications",
      href: "/dashboard/admin/notifications",
      icon: Bell,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter uppercase leading-[0.85]">
            Overview
          </h1>
          <p className="text-muted-foreground font-semibold text-base max-w-2xl leading-relaxed border-l-4 border-red-500/20 pl-4">
            Full platform oversight — manage donors, organizations, blood
            operations, and system health from one unified console.
          </p>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link href={stat.href}>
              <Card className="rounded-4xl border-border/40 overflow-hidden shadow-none hover:shadow-premium transition-all duration-300 bg-card group h-full cursor-pointer">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`size-11 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <stat.icon className="size-5" />
                    </div>
                    <ArrowUpRight
                      className={`size-4 ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity`}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-muted-foreground  opacity-60">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-black text-foreground tracking-tighter">
                      {isLoading ? (
                        <span className="inline-block w-12 h-7 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                      ) : (
                        stat.val
                      )}
                    </p>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground opacity-40 ">
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.section>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-8 rounded-[3.5rem] bg-white dark:bg-zinc-900 border border-border/50 shadow-premium"
        >
          <ChartAreaInteractive />
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-4 p-8 rounded-[3.5rem] bg-zinc-950 text-white relative overflow-hidden group shadow-2xl"
        >
          <Globe className="absolute -bottom-10 -right-10 size-64 text-white/5 -rotate-12 transition-transform duration-1000 group-hover:scale-110" />
          <div className="relative z-10 space-y-8">
            <div className="space-y-2">
              <h3 className="text-2xl font-black leading-[0.9] uppercase">
                Recent <span className="text-white/20">Activity</span>
              </h3>
            </div>
            <div className="space-y-4">
              {recentActivity.length === 0 && (
                <p className="text-xs text-white/40 font-bold">No recent platform activity yet.</p>
              )}
              {recentActivity.map((item) => (
                <div
                  key={`${item.action}-${item.time}`}
                  className="flex items-start gap-3 border-b border-white/5 pb-4 last:border-none last:pb-0"
                >
                  <div className="size-2 rounded-full bg-red-500 mt-2 shrink-0 animate-pulse" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{item.action}</p>
                    <p className="text-[10px] text-white/40 font-black uppercase  truncate">
                      {item.org}
                    </p>
                    <p className="text-[10px] text-white/20 font-bold mt-0.5">
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="p-10 rounded-[3.5rem] bg-white dark:bg-zinc-900 border border-border/50 shadow-premium"
      >
        <div className="mb-8 px-2">
          <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase">
            Quick <span className="text-muted-foreground/20">Actions</span>
          </h3>
          <p className="text-xs font-semibold text-muted-foreground opacity-60 uppercase tracking-tight mt-1">
            Jump to critical admin operations
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.label} href={link.href}>
              <div className="group p-5 rounded-3xl border border-border/40 hover:border-red-500/20 hover:shadow-premium transition-all duration-300 flex flex-col items-center gap-3 text-center cursor-pointer hover:bg-red-500/5">
                <div
                  className={`size-12 rounded-2xl ${link.bg} ${link.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <link.icon className="size-6" />
                </div>
                <span className="text-[10px] font-black uppercase  text-muted-foreground group-hover:text-foreground transition-colors">
                  {link.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}