export async function clearAuthSession(): Promise<{ success: boolean }> {
  const res = await fetch("/api/auth/sync-session", {
    method: "DELETE",
    credentials: "include",
    cache: "no-store",
  });

  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    message?: string;
  } | null;

  if (!res.ok || !json?.success) {
    throw new Error(json?.message || "Failed to clear session cookies");
  }

  return { success: true };
}
