"use server";

import { serverFetch } from "@/helper/server-fetch";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

export const getMyReports = async () => {
  try {
    const res = await serverFetch.get("/reports/me");
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getAllReports = async (
  params?: Record<string, string | number | undefined>,
) => {
  try {
    const q = new URLSearchParams();
    if (params)
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.set(k, String(v));
      });
    const qs = q.toString();
    const res = await serverFetch.get(`/reports${qs ? `?${qs}` : ""}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const createReport = async (data: {
  targetType: string;
  targetId: string;
  reason: string;
}) => {
  try {
    const res = await serverFetch.post("/reports", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.REPORTS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const updateReportStatus = async (data: {
  id: string;
  status: string;
}) => {
  try {
    const res = await serverFetch.patch(`/reports/${data.id}/status`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: data.status }),
    });
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const deleteReport = async (id: string) => {
  try {
    const res = await serverFetch.delete(`/reports/${id}`);
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};
