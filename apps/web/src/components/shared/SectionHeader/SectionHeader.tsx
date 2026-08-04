import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  button?: {
    text: string;
    href: string;
    variant?: "primary" | "secondary" | "outline";
  };
}

export default function SectionHeader({
  title,
  subtitle,
  button,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
      <div className="max-w-3xl space-y-4">
        {/* <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase  border border-primary/20">
          <div className="size-1.5 rounded-full bg-primary animate-pulse" />
          <span>Discover</span>
        </div> */}
        <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-[0.95] uppercase">
          {title}
        </h2>
        {subtitle && (
          <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-2xl border-l-2 border-primary/20 pl-3 ">
            {subtitle}
          </p>
        )}
      </div>

      {button && (
        <Link href={button.href} className="group">

          <Button
            className="w-full sm:w-auto h-14 px-8 text-xs rounded-2xl bg-primary hover:bg-emerald-600 shadow-2xl shadow-primary/30 transition-all duration-300 font-black uppercase  text-white group"
          >
            {button.text}
            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      )}
    </div>
  );
}
