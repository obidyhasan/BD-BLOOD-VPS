import { ReactNode } from "react";

interface PageHeaderProps {
  icon: ReactNode;
  badgeText: string;
  titleBase: string;
  titleSpan?: string;
  titleSuffix?: string;
  description: string;
  stats?: ReactNode;
}

export const PageHeader = ({
  icon,
  badgeText,
  titleBase,
  titleSpan,
  titleSuffix,
  description,
  stats,
}: PageHeaderProps) => {
  return (
    <div className="bg-gradient-to-b from-emerald-50/50 to-white dark:from-zinc-900/50 dark:to-zinc-950 border-b border-border/40 pt-28 pb-10 mb-10">
      <div className="max-w-7xl mx-auto px-6 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase  border border-primary/20">
          {icon}
          <span>{badgeText}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter uppercase leading-none">
          {titleBase} {titleSpan && <span className="text-primary">{titleSpan}</span>} {titleSuffix}
        </h1>
        <p className="text-muted-foreground text-md font-medium max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>
        {stats && <div className="flex items-center justify-center gap-6 pt-4">{stats}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
