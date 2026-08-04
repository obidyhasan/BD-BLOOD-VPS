import { cn } from "@/lib/utils";
import { BDLogo } from "@/components/ui/bd-logo";

/**
 * @deprecated Prefer importing `BDLogo` directly from
 * `@/components/ui/bd-logo`. Kept as a thin wrapper for backwards
 * compatibility since this file previously exported the temporary
 * image-based logo.
 */
export const Logo = ({ className }: { className?: string }) => {
  return <BDLogo size="sm" className={cn(className)} />;
};
