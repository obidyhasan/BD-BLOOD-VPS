"use server";

import { revalidateTag } from "next/cache";
import { serverFetch } from "@/helper/server-fetch";
import { CACHE_TAGS } from "@/lib/cache";

export async function getFaqs(params?: {
  page?: number;
  limit?: number;
  category?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  try {
    const qp = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          qp.set(key, String(value));
        }
      });
    }
    const qs = qp.toString();
    const res = await serverFetch.get(`/faqs${qs ? `?${qs}` : ""}`);
    return await res.json();
  } catch {
    return { success: false, data: [], meta: { page: 1, limit: 0, total: 0 } };
  }
}

export async function createFaq(body: Record<string, unknown>) {
  try {
    const res = await serverFetch.post("/faqs", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (result.success) revalidateTag(CACHE_TAGS.FAQS, {});
    return result;
  } catch {
    return { success: false, message: "Failed to create FAQ" };
  }
}
