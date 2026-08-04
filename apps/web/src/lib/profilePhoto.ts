/** Normalize profile photo URLs for Next.js Image and avatar components. */
export function resolveProfilePhoto(photo?: string | null): string | null {
  if (!photo?.trim()) return null;

  const trimmed = photo.trim();
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  return null;
}

export function isExternalProfilePhoto(src: string | null): src is string {
  return (
    !!src &&
    !src.startsWith("/") &&
    !src.startsWith("blob:") &&
    !src.startsWith("data:")
  );
}
