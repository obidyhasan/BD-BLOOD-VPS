"use client";

import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
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
import { ShieldCheck } from "lucide-react";

import { useMemo } from "react";
import { useGetAllPositionsQuery } from "@/redux/features/organizations/organizationsApi";
import { mapOrganizationPositionToUI } from "@/lib/position";

const getLevelStyles = (level: string) => {
  if (level === "Executive") return "bg-primary/10 text-primary border-primary/20";
  if (level === "Management") return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
};

const PositionPage = () => {
  const { data: positionsData, isLoading } = useGetAllPositionsQuery();

  const positions = useMemo(
    () => (positionsData?.data ?? []).map(mapOrganizationPositionToUI),
    [positionsData],
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <DashboardHeader
          variant="clinical"
          title="Positions"
          subtitle="View all leadership positions and roles."
          badge="List of Roles"
        />

        <div className="px-4 py-2 rounded-3xl bg-white dark:bg-zinc-900 border border-border/40 shadow-premium flex items-center gap-4">
          <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40">Total Roles</p>
            <p className="text-xl font-black tracking-tighter">{positions.length}</p>
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <Card className="rounded-[3rem] border-border/40 overflow-hidden shadow-none bg-card border-dashed">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-border/40 h-16">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="px-8 font-black uppercase text-[10px] ">Position Name</TableHead>
                  <TableHead className="font-black uppercase text-[10px]  text-center">People Count</TableHead>
                  <TableHead className="font-black uppercase text-[10px]  text-center">Role Level</TableHead>
                  <TableHead className="text-right px-8 font-black uppercase text-[10px] ">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground font-bold">
                      Loading positions...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && positions.map((item) => (
                  <TableRow key={item.id} className="h-24 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-all border-b border-border/20 last:border-none">
                    <TableCell className="px-8 flex items-center gap-4 h-24">
                      <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs tracking-tighter shrink-0">
                        {item.name.charAt(0)}
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-black text-sm uppercase tracking-tighter text-foreground">{item.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-black text-sm">{item.members}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={`rounded-full px-4 py-1.5 text-[9px] font-black uppercase  border ${getLevelStyles(item.level)}`}>
                        {item.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <Badge variant="outline" className="rounded-full px-4 py-1.5 text-[9px] font-black uppercase ">
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

export default PositionPage;
