"use client";

import { useMemo, useState } from "react";
import { Terminal } from "lucide-react";
import { type ActivityFeedItem } from "@/redux/features/analytics/analyticsApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AuditLogSection({ items }: { items: ActivityFeedItem[] }) {
  const [organization, setOrganization] = useState("all");
  const organizations = useMemo(() => [...new Set(items.map((item) => item.org))].sort(), [items]);
  const visible = organization === "all" ? items : items.filter((item) => item.org === organization);

  return (
    <section className="space-y-5 rounded-[3rem] border border-border/50 bg-card p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-zinc-950 text-white"><Terminal className="size-5" /></div>
          <div><h2 className="text-xl font-black uppercase tracking-tight">Platform activity</h2><p className="text-sm text-muted-foreground">Recent auditable operations across the network.</p></div>
        </div>
        <Select value={organization} onValueChange={setOrganization}>
          <SelectTrigger className="h-11 w-full rounded-xl md:w-64"><SelectValue placeholder="All organizations" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All organizations</SelectItem>{organizations.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border/40">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-4">Timestamp</th><th className="px-5 py-4">Organization</th><th className="px-5 py-4">Activity</th><th className="px-5 py-4">Status</th></tr></thead>
          <tbody className="divide-y divide-border/40">
            {visible.map((item) => <tr key={item.id} className="hover:bg-muted/30"><td className="whitespace-nowrap px-5 py-4 font-semibold">{item.date}</td><td className="px-5 py-4 font-bold">{item.org}</td><td className="px-5 py-4">{item.action}</td><td className="px-5 py-4"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{item.status}</span></td></tr>)}
            {!visible.length && <tr><td colSpan={4} className="px-5 py-12 text-center font-semibold text-muted-foreground">No platform activity for this selection.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
