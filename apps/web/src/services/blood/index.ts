"use server";

import { serverFetch } from "@/helper/server-fetch";

export const getBloodGroups = async (params?: { limit?: number }) => {
  try {
    const q = new URLSearchParams({ limit: String(params?.limit ?? 50) });
    const res = await serverFetch.get(`/blood/groups?${q}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};
