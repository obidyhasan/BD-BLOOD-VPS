"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";
import { motion } from "motion/react";

interface Doctor {
  name: string;
  specialty: string;
  chamber: string;
  phone: string;
  exp: string;
}

export function DoctorCard({ doctor, index }: { doctor: Doctor; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="shadow-none border-border/50 rounded-[2.5rem] overflow-hidden bg-white dark:bg-zinc-900 transition-all duration-500 hover:shadow-premium group h-full">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className="relative">
              <div className="size-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 overflow-hidden">
                <Stethoscope className="size-10" />
              </div>
            </div>
            <Badge className="rounded-full px-4 py-1.5 text-xs font-semibold uppercase  shadow-xl shadow-primary/10">
              {doctor.exp}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-primary uppercase ">
              {doctor.specialty}
            </p>
            <h3 className="text-2xl font-black text-foreground tracking-tight leading-tight">
              {doctor.name}
            </h3>
          </div>
          <p className="text-muted-foreground font-semibold text-sm h-10 line-clamp-2">
            {doctor.chamber}
          </p>
          <Button asChild className="w-full rounded-2xl h-14 font-black shadow-xl shadow-primary/10">
            <a href={`tel:${doctor.phone}`} aria-label={`Call ${doctor.name}`}>
              Contact Doctor
            </a>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
