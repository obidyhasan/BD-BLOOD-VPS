"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Hospital, MapPin, Phone, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

interface Institution {
  slug: string;
  name: string;
  type: string;
  phone: string;
  district: string;
  status: string;
}

export function InstitutionCard({ item, index }: { item: Institution; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="shadow-none border-border/50 rounded-[2.5rem] overflow-hidden bg-card transition-all duration-300 hover:shadow-premium group h-full">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Hospital className="size-7" />
            </div>
            <Badge
              variant="outline"
              className="rounded-full px-3 py-1 text-[10px] font-black uppercase text-emerald-500 border-emerald-500/20 bg-emerald-500/5"
            >
              {item.status}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em]">
              {item.type}
            </p>
            <h3 className="text-2xl font-black text-foreground tracking-tight leading-tight">
              {item.name}
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-muted-foreground font-medium text-sm">
              <MapPin className="size-4" /> {item.district}, BD
            </div>
            <div className="flex items-center gap-3 text-muted-foreground font-medium text-sm">
              <Phone className="size-4" /> {item.phone}
            </div>
          </div>
          <Link href={`/medical/${item.slug}`} className="w-full">
            <Button
              variant="outline"
              className="w-full rounded-2xl h-14 font-black border-border/50 group-hover:bg-primary group-hover:text-white transition-all shadow-none"
            >
              View Medical
              <ArrowRight className="ml-2 size-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
