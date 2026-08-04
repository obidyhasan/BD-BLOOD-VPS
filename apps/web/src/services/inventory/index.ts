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

export const upsertInventory = async (data: {
  organizationId: string;
  bloodGroupId: string;
  availableUnits: number;
}) => {
  try {
    const res = await serverFetch.post("/organization-inventory/upsert", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const updateInventoryItem = async (data: {
  id: string;
  availableUnits: number;
}) => {
  try {
    const res = await serverFetch.patch(`/organization-inventory/${data.id}`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availableUnits: data.availableUnits }),
    });
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};
