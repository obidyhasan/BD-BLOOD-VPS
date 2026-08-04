"use server";

import { serverFetch } from "@/helper/server-fetch";

export const getDivisions = async () => {
  try {
    const res = await serverFetch.get("/location/divisions?limit=20");
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getDistricts = async (params?: {
  divisionId?: string;
  limit?: number;
}) => {
  try {
    const q = new URLSearchParams({ limit: String(params?.limit ?? 100) });
    if (params?.divisionId) q.set("divisionId", params.divisionId);
    const res = await serverFetch.get(`/location/districts?${q}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getUpazilas = async (params?: {
  districtId?: string;
  limit?: number;
}) => {
  try {
    const q = new URLSearchParams({ limit: String(params?.limit ?? 200) });
    if (params?.districtId) q.set("districtId", params.districtId);
    const res = await serverFetch.get(`/location/upazilas?${q}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};
