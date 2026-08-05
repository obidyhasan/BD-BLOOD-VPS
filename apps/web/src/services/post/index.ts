"use server";

import { serverFetch } from "@/helper/server-fetch";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

export const getHomepagePosts = async () => {
  try {
    const res = await serverFetch.get(
      "/posts/homepage?successLimit=6&donorLimit=8",
      { cache: "no-store" },
    );
    return res.json();
  } catch {
    return {
      success: false,
      data: { successHistory: [], donorPosts: [] },
    };
  }
};

export const getPublicPosts = async (
  params?: Record<string, string | number | boolean | undefined>,
) => {
  try {
    const q = new URLSearchParams();
    if (params)
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.set(k, String(v));
      });
    const qs = q.toString();
    const res = await serverFetch.get(`/posts${qs ? `?${qs}` : ""}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getPublicPostBySlug = async (slug: string) => {
  try {
    const res = await serverFetch.get(`/posts/by-slug/${slug}`);
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const getPublicPostById = async (id: string) => {
  try {
    const res = await serverFetch.get(`/posts/${id}`);
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const getMyPosts = async (
  params?: Record<string, string | number | boolean | undefined>,
) => {
  try {
    const q = new URLSearchParams();
    if (params)
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.set(k, String(v));
      });
    const qs = q.toString();
    const res = await serverFetch.get(`/posts/my${qs ? `?${qs}` : ""}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getOrgPosts = async (
  params?: Record<string, string | number | boolean | undefined>,
) => {
  try {
    const q = new URLSearchParams();
    if (params)
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.set(k, String(v));
      });
    const qs = q.toString();
    const res = await serverFetch.get(`/posts/org/all${qs ? `?${qs}` : ""}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const createPost = async (data: FormData) => {
  try {
    const res = await serverFetch.post("/posts", { body: data });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.POSTS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const updatePost = async (id: string, data: FormData) => {
  try {
    const res = await serverFetch.patch(`/posts/${id}`, { body: data });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.POSTS, {});
      revalidateTag(CACHE_TAGS.POST(id), {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const deletePost = async (id: string) => {
  try {
    const res = await serverFetch.delete(`/posts/${id}`);
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.POSTS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const approvePost = async (id: string) => {
  try {
    const res = await serverFetch.patch(`/posts/admin/${id}/approval`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalStatus: "APPROVED" }),
    });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.POSTS, {});
      revalidateTag(CACHE_TAGS.POST(id), {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const rejectPost = async (id: string) => {
  try {
    const res = await serverFetch.patch(`/posts/admin/${id}/approval`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalStatus: "REJECTED" }),
    });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.POSTS, {});
      revalidateTag(CACHE_TAGS.POST(id), {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const likePost = async (id: string) => {
  try {
    const res = await serverFetch.post(`/posts/${id}/like`);
    return res.json();
  } catch {
    return { success: false, message: "Like failed" };
  }
};

export const addComment = async (id: string, data: { content: string }) => {
  try {
    const res = await serverFetch.post(`/posts/${id}/comments`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch {
    return { success: false, message: "Comment failed" };
  }
};
