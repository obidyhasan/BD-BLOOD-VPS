import { cn } from "@/lib/utils";

export type BDLogoSize = "sm" | "md" | "lg";

interface BDLogoProps {
  /** Additional classes applied to the wrapping element. */
  className?: string;
  /** Controls the wordmark's font size. Defaults to "md". */
  size?: BDLogoSize;
  /**
   * Renders only the compact "BD" mark instead of the full "BD Blood"
   * wordmark. Use this where space is constrained, e.g. a collapsed
   * sidebar rail, instead of falling back to a graphical icon.
   */
  iconOnly?: boolean;
  /**
   * Use on backgrounds that are always dark regardless of the active
   * theme (e.g. the site footer). Keeps the "BD" segment legible by
   * rendering it in a light color instead of the theme foreground.
   */
  variant?: "default" | "light";
}

const sizeClasses: Record<BDLogoSize, string> = {
  sm: "text-lg gap-0.5",
  md: "text-2xl gap-0.5",
  lg: "text-3xl md:text-4xl gap-1",
};

/**
 * Text-based "BD Blood" wordmark. Replaces the temporary logo.svg /
 * logo-name.svg image assets across the app. Built entirely from the
 * project's existing Inter font (applied globally in the root layout)
 * and theme color tokens — no external font, image, or gradient.
 */
export const BDLogo = ({
  className,
  size = "md",
  iconOnly = false,
  variant = "default",
}: BDLogoProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-black uppercase leading-none tracking-tight select-none",
        sizeClasses[size],
        className,
      )}
    >
      <span
        className={cn(
          variant === "light" ? "text-white" : "text-foreground",
        )}
      >
        BD
      </span>
      {!iconOnly && <span className="text-primary">Blood</span>}
    </span>
  );
};
