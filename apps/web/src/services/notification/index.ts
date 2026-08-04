"use server";

import { serverFetch } from "@/helper/server-fetch";

export const getMyNotifications = async (
  params?: Record<string, string | number>,
) => {
  try {
    const q = params
      ? `?${new URLSearchParams(params as Record<string, string>)}`
      : "";
    const res = await serverFetch.get(`/notifications/me${q}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const markNotificationRead = async (data: {
  id: string;
  isRead: boolean;
}) => {
  try {
    const res = await serverFetch.patch(`/notifications/${data.id}/read`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: data.isRead }),
    });
    return res.json();
  } catch {
    return { success: false };
  }
};

export const markAllRead = async () => {
  try {
    const res = await serverFetch.post("/notifications/me/read-all");
    return res.json();
  } catch {
    return { success: false };
  }
};

export const deleteNotification = async (id: string) => {
  try {
    const res = await serverFetch.delete(`/notifications/${id}`);
    return res.json();
  } catch {
    return { success: false };
  }
};

export const createNotification = async (data: {
  donorId: string;
  title: string;
  message: string;
  type: string;
  priority?: string;
  relatedId?: string;
  relatedType?: string;
}) => {
  try {
    const res = await serverFetch.post("/notifications", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const broadcastNotification = async (data: {
  title: string;
  message: string;
  type: string;
  priority?: string;
}) => {
  try {
    const res = await serverFetch.post("/notifications/broadcast", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};
