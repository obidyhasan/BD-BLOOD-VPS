"use server";

import { serverFetch } from "@/helper/server-fetch";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

export const getPublicBlogs = async (
  params?: Record<string, string | number | boolean | undefined>,
) => {
  try {
    const q = new URLSearchParams();
    if (params)
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.set(k, String(v));
      });
    const qs = q.toString();
    const res = await serverFetch.get(`/blogs${qs ? `?${qs}` : ""}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getPublicBlogBySlug = async (slug: string) => {
  try {
    const res = await serverFetch.get(`/blogs/by-slug/${slug}`);
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const getPublicBlogById = async (id: string) => {
  try {
    const res = await serverFetch.get(`/blogs/${id}`);
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const getAdminBlogs = async (
  params?: Record<string, string | number | boolean | undefined>,
) => {
  try {
    const q = new URLSearchParams();
    if (params)
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.set(k, String(v));
      });
    const qs = q.toString();
    const res = await serverFetch.get(`/blogs/admin/all${qs ? `?${qs}` : ""}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getAdminBlogById = async (id: string) => {
  try {
    const res = await serverFetch.get(`/blogs/admin/${id}`);
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const createBlog = async (data: FormData) => {
  try {
    const res = await serverFetch.post("/blogs", { body: data });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.BLOGS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const updateBlog = async (id: string, data: FormData) => {
  try {
    const res = await serverFetch.patch(`/blogs/${id}`, { body: data });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.BLOGS, {});
      revalidateTag(CACHE_TAGS.BLOG(id), {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const deleteBlog = async (id: string) => {
  try {
    const res = await serverFetch.delete(`/blogs/${id}`);
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.BLOGS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const approveBlog = async (id: string) => {
  try {
    const res = await serverFetch.patch(`/blogs/admin/${id}/status`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.BLOGS, {});
      revalidateTag(CACHE_TAGS.BLOG(id), {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const rejectBlog = async (id: string) => {
  try {
    const res = await serverFetch.patch(`/blogs/admin/${id}/status`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REJECTED" }),
    });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.BLOGS, {});
      revalidateTag(CACHE_TAGS.BLOG(id), {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};
