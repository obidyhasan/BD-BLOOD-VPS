"use server";

import { serverFetch } from "@/helper/server-fetch";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

export const getAllBloodRequests = async (
  params?: Record<string, string | number | boolean | undefined>,
) => {
  try {
    const q = new URLSearchParams();
    if (params)
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.set(k, String(v));
      });
    const qs = q.toString();
    const res = await serverFetch.get(`/blood-requests${qs ? `?${qs}` : ""}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getSingleBloodRequest = async (id: string) => {
  try {
    const res = await serverFetch.get(`/blood-requests/${id}`);
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const createBloodRequest = async (data: {
  requesterName: string;
  requesterPhone: string;
  bloodGroupId: string;
  hospitalName: string;
  divisionId: string;
  districtId: string;
  upazilaId: string;
  requiredUnits: number;
  requestType?: string;
  message?: string;
}) => {
  try {
    const res = await serverFetch.post("/blood-requests", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.BLOOD_REQUESTS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const updateBloodRequestStatus = async (data: {
  id: string;
  status: string;
}) => {
  try {
    const res = await serverFetch.patch(`/blood-requests/${data.id}/status`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: data.status }),
    });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.BLOOD_REQUESTS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const rematchOrganizations = async (id: string) => {
  try {
    const res = await serverFetch.post(`/blood-requests/${id}/rematch`);
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};
