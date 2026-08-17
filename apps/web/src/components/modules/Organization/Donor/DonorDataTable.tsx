"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { bloodGroup } from "@/constant/BloodGroup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock, Droplets, ExternalLink, MapPin, Phone, Search } from "lucide-react";

export const donorSchema = z.object({
  id: z.string(), slug: z.string(), name: z.string(), bloodGroup: z.string(),
  phone: z.string(), district: z.string(), lastDonationDate: z.string(),
  available: z.boolean(), accountStatus: z.enum(["active", "deactive", "suspended"]),
});
type Donor = z.infer<typeof donorSchema>;
const PAGE_SIZE = 8;

export function DonorDataTable({ data }: { data: Donor[] }) {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("All");
  const [availability, setAvailability] = useState("All");
  const [page, setPage] = useState(0);
  const filtered = useMemo(() => data.filter((donor) => {
    const query = search.toLowerCase();
    return (!query || donor.name.toLowerCase().includes(query) || donor.phone.includes(query) || donor.district.toLowerCase().includes(query))
      && (group === "All" || donor.bloodGroup === group)
      && (availability === "All" || (availability === "available") === donor.available);
  }), [availability, data, group, search]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const changeFilter = <T,>(setter: (value: T) => void, value: T) => { setter(value); setPage(0); };

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 lg:flex-row">
      <div className="relative min-w-0 flex-1"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => changeFilter(setSearch, event.target.value)} placeholder="Search name, phone or location…" className="h-12 rounded-2xl pl-11" /></div>
      <Select value={group} onValueChange={(value) => changeFilter(setGroup, value)}><SelectTrigger className="h-12 w-full rounded-2xl lg:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All blood groups</SelectItem>{bloodGroup.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
      <Select value={availability} onValueChange={(value) => changeFilter(setAvailability, value)}><SelectTrigger className="h-12 w-full rounded-2xl lg:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All availability</SelectItem><SelectItem value="available">Available</SelectItem><SelectItem value="unavailable">Unavailable</SelectItem></SelectContent></Select>
    </div>
    <Card className="overflow-hidden rounded-[2rem] border-border/40"><CardContent className="overflow-x-auto p-0"><Table className="min-w-[820px]">
      <TableHeader><TableRow><TableHead className="px-6">Donor</TableHead><TableHead>Blood group</TableHead><TableHead>Contact</TableHead><TableHead>Location</TableHead><TableHead>Last donation</TableHead><TableHead className="px-6">Availability</TableHead></TableRow></TableHeader>
      <TableBody>{rows.length === 0 ? <TableRow><TableCell colSpan={6} className="h-40 text-center text-muted-foreground">No affiliated donors match these filters.</TableCell></TableRow> : rows.map((donor) => <TableRow key={donor.id}>
        <TableCell className="px-6"><Button asChild variant="ghost" className="h-auto p-0 font-semibold text-primary hover:bg-transparent"><Link href={`/donor/${donor.slug}`}>{donor.name}<ExternalLink className="ml-2 size-3" /></Link></Button></TableCell>
        <TableCell><Badge variant="outline" className="text-red-600"><Droplets className="mr-1 size-3" />{donor.bloodGroup}</Badge></TableCell>
        <TableCell><span className="flex items-center gap-2 text-sm"><Phone className="size-3 text-primary" />{donor.phone}</span></TableCell>
        <TableCell><span className="flex items-center gap-2 text-sm"><MapPin className="size-3 text-primary" />{donor.district}</span></TableCell>
        <TableCell><span className="flex items-center gap-2 text-sm"><Calendar className="size-3" />{donor.lastDonationDate || "Never"}</span></TableCell>
        <TableCell className="px-6">{donor.available ? <Badge className="bg-emerald-600"><CheckCircle2 className="mr-1 size-3" />Available</Badge> : <Badge variant="secondary"><Clock className="mr-1 size-3" />Unavailable</Badge>}</TableCell>
      </TableRow>)}</TableBody>
    </Table></CardContent></Card>
    <div className="flex items-center justify-between gap-4"><p className="text-xs text-muted-foreground">Page {safePage + 1} of {pageCount} · {filtered.length} donors</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={safePage === 0} onClick={() => setPage((current) => current - 1)}><ChevronLeft className="size-4" />Previous</Button><Button variant="outline" size="sm" disabled={safePage >= pageCount - 1} onClick={() => setPage((current) => current + 1)}>Next<ChevronRight className="size-4" /></Button></div></div>
  </div>;
}
