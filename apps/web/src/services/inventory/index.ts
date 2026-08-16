"use server";

import { serverFetch } from "@/helper/server-fetch";

export const getOrganizationInventory = async (organizationId: string) => {
  try {
    const res = await serverFetch.get(
      `/organization-inventory/organization/${organizationId}`,
    );
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getAllInventory = async (
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
      `/organization-inventory${qs ? `?${qs}` : ""}`,
    );
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};
