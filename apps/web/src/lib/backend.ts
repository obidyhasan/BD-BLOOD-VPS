const parseUrlList = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((url) => url.trim().replace(/\/$/, ""))
    .filter(Boolean);

export const BACKEND_API_URLS = parseUrlList(process.env.NEXT_PUBLIC_API_URL);
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
