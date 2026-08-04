"use server";

import { serverFetch } from "@/helper/server-fetch";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

export const getAllGalleries = async (
  params?: Record<string, string | number | boolean | undefined>,
) => {
  try {
    const q = new URLSearchParams();
    if (params)
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.set(k, String(v));
      });
    const qs = q.toString();
    const res = await serverFetch.get(`/galleries${qs ? `?${qs}` : ""}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getGalleryBySlug = async (slug: string) => {
  try {
    const res = await serverFetch.get(`/galleries/by-slug/${slug}`);
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const getSingleGallery = async (id: string) => {
  try {
    const res = await serverFetch.get(`/galleries/${id}`);
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const createGallery = async (data: FormData) => {
  try {
    const res = await serverFetch.post("/galleries", { body: data });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.GALLERY, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const updateGallery = async (id: string, data: FormData) => {
  try {
    const res = await serverFetch.patch(`/galleries/${id}`, { body: data });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.GALLERY, {});
      revalidateTag(CACHE_TAGS.GALLERY_ITEM(id), {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const deleteGallery = async (id: string) => {
  try {
    const res = await serverFetch.delete(`/galleries/${id}`);
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.GALLERY, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};
