import { MoveLeft } from "lucide-react";
import Link from "next/link";

interface DetailsHeaderProps {
  backLink: string;
  backText: string;
  badge?: React.ReactNode;
  title: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const DetailsHeader = ({
  backLink,
  backText,
  badge,
  title,
  rightElement,
}: DetailsHeaderProps) => {
  return (
    <div className="bg-gradient-to-b from-emerald-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-950 border-b border-border/40 pt-28 pb-10 mb-10">
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <Link
          href={backLink}
          className="inline-flex items-center gap-2 text-xs font-black uppercase  text-muted-foreground hover:text-primary transition-colors group"
        >
          <MoveLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
          {backText}
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-4">
            {badge && <div className="flex items-center gap-3">{badge}</div>}
            <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter leading-none uppercase">
              {title}
            </h1>
          </div>
          {rightElement && (
            <div className="hidden sm:block flex items-center justify-center md:justify-end gap-4">
              {rightElement}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailsHeader;
