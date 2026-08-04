export async function clientJsonFetch<T = unknown>(
  url: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init;
  const finalInit: RequestInit = {
    ...rest,
    headers: {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
  };
  if (json !== undefined) finalInit.body = JSON.stringify(json);

  const res = await fetch(url, { ...finalInit, cache: "no-store" });
  try {
    return (await res.json()) as T;
  } catch {
    return { success: false, message: "Invalid server response." } as T;
  }
}
