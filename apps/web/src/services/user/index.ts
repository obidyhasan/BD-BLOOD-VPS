"use server";

import { serverFetch } from "@/helper/server-fetch";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

export const getProfile = async () => {
  try {
    const res = await serverFetch.get("/user/me");
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const updateProfile = async (data: FormData) => {
  try {
    const res = await serverFetch.patch("/user/update", { body: data });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.USER_ME, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const deleteAccount = async () => {
  try {
    const res = await serverFetch.delete("/user/delete");
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.USER_ME, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const getPublicDonors = async (
  params?: Record<string, string | number | boolean | undefined>,
) => {
  try {
    const q = new URLSearchParams();
    if (params)
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.set(k, String(v));
      });
    const res = await serverFetch.get(`/user/public/donors?${q}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getPublicDonorBySlug = async (slug: string) => {
  try {
    const res = await serverFetch.get(`/user/public/donors/by-slug/${slug}`);
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const getPublicDonorById = async (id: string) => {
  try {
    const res = await serverFetch.get(`/user/public/donors/${id}`);
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const getAllDonors = async (
  params?: Record<string, string | number | boolean | undefined>,
) => {
  try {
    const q = new URLSearchParams();
    if (params)
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.set(k, String(v));
      });
    const qs = q.toString();
    const res = await serverFetch.get(`/user${qs ? `?${qs}` : ""}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getDonorById = async (id: string) => {
  try {
    const res = await serverFetch.get(`/user/admin/by-id/${id}`);
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const updateDonorStatus = async (
  id: string,
  data: { accountStatus?: string; availabilityStatus?: string },
) => {
  try {
    const res = await serverFetch.patch(`/user/admin/by-id/${id}`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.DONORS_PUBLIC, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};
