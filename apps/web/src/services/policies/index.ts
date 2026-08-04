"use server";

import { revalidateTag } from "next/cache";
import { serverFetch } from "@/helper/server-fetch";
import { CACHE_TAGS } from "@/lib/cache";

export async function getPolicies(params?: {
  category?: string;
  active?: boolean;
}) {
  try {
    const qp = new URLSearchParams();
    if (params?.category) qp.set("category", params.category);
    if (params?.active !== undefined) qp.set("active", String(params.active));
    const qs = qp.toString();
    const res = await serverFetch.get(`/policies${qs ? `?${qs}` : ""}`);
    return await res.json();
  } catch {
    return { success: false, data: [] };
  }
}

export async function createPolicy(body: Record<string, unknown>) {
  try {
    const res = await serverFetch.post("/policies", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (result.success) revalidateTag(CACHE_TAGS.POLICIES, {});
    return result;
  } catch {
    return { success: false, message: "Failed to create policy" };
  }
}
