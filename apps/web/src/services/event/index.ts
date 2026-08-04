"use server";

import { serverFetch } from "@/helper/server-fetch";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

export const getAllEvents = async (
  params?: Record<string, string | number | boolean | undefined>,
) => {
  try {
    const q = new URLSearchParams();
    if (params)
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.set(k, String(v));
      });
    const qs = q.toString();
    const res = await serverFetch.get(`/events${qs ? `?${qs}` : ""}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getEventBySlug = async (slug: string) => {
  try {
    const res = await serverFetch.get(`/events/by-slug/${slug}`);
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const getSingleEvent = async (id: string) => {
  try {
    const res = await serverFetch.get(`/events/${id}`);
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const createEvent = async (data: Record<string, unknown>) => {
  try {
    const res = await serverFetch.post("/events", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.EVENTS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const updateEvent = async (
  id: string,
  data: Record<string, unknown>,
) => {
  try {
    const res = await serverFetch.patch(`/events/${id}`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.EVENTS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const deleteEvent = async (id: string) => {
  try {
    const res = await serverFetch.delete(`/events/${id}`);
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.EVENTS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const joinEvent = async (data: {
  eventId: string;
  participationType: "DONOR" | "VOLUNTEER";
}) => {
  try {
    const res = await serverFetch.post(`/events/${data.eventId}/join`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participationType: data.participationType }),
    });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.EVENTS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};
