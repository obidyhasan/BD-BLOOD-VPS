"use client";

import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  variant?: "default" | "clinical";
  className?: string;
}

export default function DashboardHeader({
  title,
  subtitle,
  badge,
  variant = "default",
  className,
}: SectionHeaderProps) {
  if (variant === "clinical") {
    return (
      <div className={cn("space-y-4 mb-4 animate-in slide-in-from-left duration-700", className)}>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter uppercase leading-[0.85]">
            {title.split(" ").map((word, i) => (
              <span key={i} className={cn(i > 0 && "text-muted-foreground/20 block md:inline md:ml-2")}>
                {word} {i === 0 && <br className="md:hidden" />}
              </span>
            ))}
          </h1>
          {/* {badge && (
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20 ml-2">
              {badge}
            </span>
          )} */}
        </div>
        {subtitle && (
          <p className="text-muted-foreground font-semibold text-base max-w-2xl leading-relaxed border-l-4 border-primary/20 pl-3">
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2 mb-8 animate-in slide-in-from-left duration-500", className)}>
      <div className="flex items-center gap-3">
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter uppercase leading-none">
          {title}
        </h1>
        {badge && (
          <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase  border border-primary/20">
            {badge}
          </span>
        )}
      </div>
      {subtitle ? (
        <p className="text-muted-foreground font-medium text-base max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      ) : null}
      <div className="w-12 h-1.5 bg-primary rounded-full mt-4 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
    </div>
  );
}
