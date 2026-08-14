export function readSetCookieValue(headers: Headers, name: string): string | null {
  const extendedHeaders = headers as Headers & { getSetCookie?: () => string[] };
  const raw = extendedHeaders.getSetCookie?.().join(",") ?? headers.get("set-cookie") ?? "";
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = raw.match(new RegExp(`(?:^|,\\s*)${escapedName}=([^;,]+)`));
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}
