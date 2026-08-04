/**
 * Shared helpers for building per-page `generateMetadata` output on the
 * dynamic public detail pages (blog, post, event, organization, gallery,
 * medical institution, donor profile).
 *
 * Kept intentionally small: strip any HTML out of rich-text fields, clamp
 * to a sane description length, and assemble the title/description/OG
 * object the same way everywhere so each page.tsx only has to supply the
 * entity-specific fields.
 */

const SITE_NAME = "BD Blood";
const DEFAULT_DESCRIPTION =
  "Bangladesh's donor network connecting blood donors, hospitals, and organizations.";

/** Strips HTML tags and collapses whitespace from rich-text content. */
export function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Truncates plain text to `max` characters on a word boundary. */
export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max)}…`;
}

/** Builds a plain-text meta description from a raw (possibly HTML) field. */
export function toDescription(raw?: string | null, fallback = DEFAULT_DESCRIPTION) {
  const text = stripHtml(raw);
  return text ? truncate(text) : fallback;
}

interface EntityMetadataInput {
  title: string;
  description?: string | null;
  image?: string | null;
  path: string;
}

/**
 * Builds a Next.js `Metadata` object for a single public detail page.
 * `path` should be the page's own route (e.g. `/blog/my-post-slug`) so
 * `openGraph.url` and canonical resolve correctly against `metadataBase`.
 */
export function buildEntityMetadata({
  title,
  description,
  image,
  path,
}: EntityMetadataInput) {
  const desc = toDescription(description);
  return {
    title: `${title} | ${SITE_NAME}`,
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: desc,
      url: path,
      siteName: SITE_NAME,
      type: "article" as const,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? ("summary_large_image" as const) : ("summary" as const),
      title,
      description: desc,
      ...(image ? { images: [image] } : {}),
    },
  };
}

/** Fallback metadata for when the entity couldn't be found (deleted/bad slug). */
export function notFoundMetadata(noun: string) {
  return {
    title: `${noun} not found | ${SITE_NAME}`,
    description: DEFAULT_DESCRIPTION,
  };
}
