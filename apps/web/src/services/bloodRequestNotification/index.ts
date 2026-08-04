"use server";

import { serverFetch } from "@/helper/server-fetch";

export const getOrganizationBloodRequestNotifications = async (
  params?: Record<string, string | number | undefined>,
) => {
  try {
    const q = new URLSearchParams();
    if (params)
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.set(k, String(v));
      });
    const qs = q.toString();
    const res = await serverFetch.get(
      `/blood-request-notifications/organization${qs ? `?${qs}` : ""}`,
    );
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};
