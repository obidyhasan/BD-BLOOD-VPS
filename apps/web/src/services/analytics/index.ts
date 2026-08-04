"use server";

import { serverFetch } from "@/helper/server-fetch";

export const getPublicStats = async () => {
  try {
    const res = await serverFetch.get("/analytics/public-stats");
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const getPlatformStats = async () => {
  try {
    const res = await serverFetch.get("/analytics/stats");
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const getBloodGroupStats = async () => {
  try {
    const res = await serverFetch.get("/analytics/blood-groups");
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getDonorGrowthStats = async (
  params?: Record<string, string | number>,
) => {
  try {
    const q = params
      ? `?${new URLSearchParams(params as Record<string, string>)}`
      : "";
    const res = await serverFetch.get(`/analytics/donor-growth${q}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getOrganizationStats = async () => {
  try {
    const res = await serverFetch.get("/analytics/organization-stats");
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getOrganizationShortage = async () => {
  try {
    const res = await serverFetch.get("/analytics/organization-shortages");
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getActivityFeed = async (
  params?: Record<string, string | number>,
) => {
  try {
    const q = params
      ? `?${new URLSearchParams(params as Record<string, string>)}`
      : "";
    const res = await serverFetch.get(`/analytics/activity-feed${q}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};
