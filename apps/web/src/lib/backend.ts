const parseUrlList = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((url) => url.trim().replace(/\/$/, ""))
    .filter(Boolean);

const publicApiUrls = parseUrlList(process.env.NEXT_PUBLIC_API_URL);
const internalApiUrls = parseUrlList(process.env.INTERNAL_API_URL);

// Browsers require the public HTTPS hostname. Server-side Next.js work can
// use Docker DNS directly and avoid an unnecessary public proxy/TLS roundtrip.
export const BACKEND_API_URLS =
  typeof window === "undefined" && internalApiUrls.length
    ? internalApiUrls
    : publicApiUrls;
export const BACKEND_API_URL = BACKEND_API_URLS[0] ?? "";

export const SOCKET_URLS = parseUrlList(
  process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL,
);
export const SOCKET_URL = SOCKET_URLS[0] ?? "";

export function joinUrl(base: string, path: string): string {
  const normalizedBase = base.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
