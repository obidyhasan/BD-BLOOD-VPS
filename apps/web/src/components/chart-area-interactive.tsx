"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Loader2 } from "lucide-react"
import { useGetAllBloodRequestsQuery } from "@/redux/features/bloodRequests/bloodRequestsApi"

function buildChartSeries(
  requests: { createdAt: string; status: string; requiredUnits: number }[],
  days: number,
) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  const buckets = new Map<string, { date: string; donations: number; requests: number }>();
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split("T")[0];
    buckets.set(key, { date: key, donations: 0, requests: 0 });
  }

  for (const r of requests) {
    const key = r.createdAt.split("T")[0];
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.requests += 1;
    if (r.status === "FULFILLED") {
      bucket.donations += r.requiredUnits;
    }
  }

  return Array.from(buckets.values());
}

const chartConfig = {
  donations: {
    label: "Donations Received",
    color: "hsl(var(--secondary))",
  },
  requests: {
    label: "Fulfilled Requests",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const { data, isLoading } = useGetAllBloodRequestsQuery({ limit: 500, sortOrder: "desc" });

  const filteredData = React.useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const rows = data?.data ?? [];
    return buildChartSeries(rows, days);
  }, [timeRange, data]);

  return (
    <div className="rounded-[3rem] border-border/40 overflow-hidden shadow-none bg-white dark:bg-zinc-900 border-dashed">
      <CardHeader className="p-6 lg:p-8 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-6 overflow-hidden">
        <div className="space-y-4">
          {/* <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase ">
            <Activity className="size-4" />
            Real-time Vitality Insights
          </div> */}
          <CardTitle className="text-4xl font-black text-foreground tracking-tighter uppercase leading-tight">Impact Velocity</CardTitle>
          <CardDescription className="max-w-md font-medium text-muted-foreground opacity-60 leading-relaxed">
            Analyzing the cadence of global donations against regional medical requirements for the previous quarter cycle.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded-2xl border border-border/40">
          {["90d", "30d", "7d"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase  transition-all ${timeRange === range ? "bg-white dark:bg-zinc-800 text-primary shadow-sm" : "text-muted-foreground hover:bg-white/50 dark:hover:bg-zinc-800/50"
                }`}
            >
              {range === "90d" ? "Quarterly" : range === "30d" ? "Monthly" : "Weekly"}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="px-10 pb-10 pt-8">
        <div className="h-[350px] w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart data={filteredData} margin={{ left: -20, right: 20, top: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillDonations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-donations)" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="var(--color-donations)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-requests)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-requests)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  minTickGap={48}
                  tick={{ fill: 'currentColor', opacity: 0.4, fontSize: 10, fontWeight: 900 }}
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()
                  }}
                />
                <ChartTooltip
                  cursor={{ stroke: 'rgba(5, 150, 105, 0.2)', strokeWidth: 2 }}
                  content={<ChartTooltipContent indicator="line" className="rounded-2xl border-border/40 shadow-2xl" />}
                />
                <Area
                  dataKey="requests"
                  type="monotone"
                  fill="url(#fillRequests)"
                  stroke="var(--color-requests)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
                <Area
                  dataKey="donations"
                  type="monotone"
                  fill="url(#fillDonations)"
                  stroke="var(--color-donations)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 p-6 rounded-[2rem] bg-zinc-50/50 dark:bg-zinc-950/20 border border-border/40">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="size-2 bg-[var(--color-donations)] rounded-full shadow-[0_0_8px_rgba(225,29,72,0.5)]" />
              <span className="text-[10px] font-black uppercase text-muted-foreground ">Donations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 bg-[var(--color-requests)] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="text-[10px] font-black uppercase text-muted-foreground ">Requests</span>
            </div>
          </div>

          {/* <div className="flex items-center gap-3">
            <TrendingUp className="size-4 text-emerald-500" />
            <span className="text-sm font-bold text-emerald-500">+14.2% Growth Efficiency</span>
          </div> */}
        </div>
      </CardContent>
    </div>
  )
}
