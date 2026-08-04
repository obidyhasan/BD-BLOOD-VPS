"use server";

import { serverFetch } from "@/helper/server-fetch";

export const getMyAppointments = async (
  params?: Record<string, string | number | undefined>,
) => {
  try {
    const q = new URLSearchParams();
    if (params)
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.set(k, String(v));
      });
    const qs = q.toString();
    const res = await serverFetch.get(`/appointments/me${qs ? `?${qs}` : ""}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const createAppointment = async (data: {
  organizationId: string;
  eventId?: string;
  bloodGroupId?: string;
  scheduledAt: string;
  notes?: string;
}) => {
  try {
    const res = await serverFetch.post("/appointments", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const updateAppointmentStatus = async (
  id: string,
  status: string,
  notes?: string,
) => {
  try {
    const res = await serverFetch.patch(`/appointments/${id}/status`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes }),
    });
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const cancelAppointment = async (id: string) => {
  try {
    const res = await serverFetch.delete(`/appointments/${id}`);
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};
