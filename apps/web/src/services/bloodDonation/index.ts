"use server";

import { serverFetch } from "@/helper/server-fetch";

export const getAllDonations = async (
  params?: Record<string, string | number | boolean | undefined>,
) => {
  try {
    const q = new URLSearchParams();
    if (params)
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.set(k, String(v));
      });
    const qs = q.toString();
    const res = await serverFetch.get(`/blood-donations${qs ? `?${qs}` : ""}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getMyDonations = async (
  params?: Record<string, string | number | boolean | undefined>,
) => {
  try {
    const q = new URLSearchParams();
    if (params)
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.set(k, String(v));
      });
    const qs = q.toString();
    const res = await serverFetch.get(
      `/blood-donations/me${qs ? `?${qs}` : ""}`,
    );
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getSingleDonation = async (id: string) => {
  try {
    const res = await serverFetch.get(`/blood-donations/${id}`);
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const createDonation = async (data: {
  recipientName?: string;
  hospitalName: string;
  divisionId: string;
  districtId: string;
  upazilaId: string;
  organizationId?: string;
  donationDate: string;
  notes?: string;
}) => {
  try {
    const res = await serverFetch.post("/blood-donations", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const verifyDonation = async (id: string) => {
  try {
    const res = await serverFetch.patch(`/blood-donations/${id}/verify`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationStatus: "VERIFIED" }),
    });
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const rejectDonation = async (id: string) => {
  try {
    const res = await serverFetch.patch(`/blood-donations/${id}/verify`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verificationStatus: "REJECTED" }),
    });
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const deleteDonation = async (id: string) => {
  try {
    const res = await serverFetch.delete(`/blood-donations/${id}`);
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};
