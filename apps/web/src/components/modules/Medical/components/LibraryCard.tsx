"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

interface MedicalInfo {
  slug: string;
  title: string;
  summary: string;
  date: string;
  category: string;
}

export function LibraryCard({ info, index }: { info: MedicalInfo; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="shadow-none border-border/50 rounded-[2.5rem] overflow-hidden bg-card hover:shadow-premium transition-all duration-300 group h-full">
        <CardContent className="p-8 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase ">
              {info.category}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold">{info.date}</span>
          </div>
          <h3 className="text-2xl font-black text-foreground tracking-tight mb-4 group-hover:text-primary transition-colors">
            {info.title}
          </h3>
          <p className="text-muted-foreground font-medium mb-8 flex-1 leading-relaxed">
            {info.summary}
          </p>
          <Link
            href={`/medical/library/${info.slug}`}
            className="flex items-center gap-2 text-primary font-black text-xs uppercase  hover:translate-x-2 transition-transform"
          >
            Read Guidelines <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
