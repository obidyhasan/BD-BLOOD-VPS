"use server";

import { serverFetch } from "@/helper/server-fetch";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

export const getAllOrganizations = async (
  params?: Record<string, string | number | boolean | undefined>,
) => {
  try {
    const q = new URLSearchParams();
    if (params)
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.set(k, String(v));
      });
    const qs = q.toString();
    const res = await serverFetch.get(`/organizations${qs ? `?${qs}` : ""}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getSingleOrganization = async (id: string) => {
  try {
    const res = await serverFetch.get(`/organizations/${id}`);
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const getOrganizationBySlug = async (slug: string) => {
  try {
    const res = await serverFetch.get(`/organizations/by-slug/${slug}`);
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const createOrganization = async (data: FormData) => {
  try {
    const res = await serverFetch.post("/organizations", { body: data });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.ORGANIZATIONS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const updateOrganization = async (id: string, data: FormData) => {
  try {
    const res = await serverFetch.patch(`/organizations/${id}`, { body: data });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.ORGANIZATIONS, {});
      revalidateTag(CACHE_TAGS.ORGANIZATION(id), {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const deleteOrganization = async (id: string) => {
  try {
    const res = await serverFetch.delete(`/organizations/${id}`);
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.ORGANIZATIONS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const getPublicLeadershipMembers = async (
  params?: Record<string, string | number | undefined>,
) => {
  try {
    const q = new URLSearchParams();
    if (params)
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.set(k, String(v));
      });
    const qs = q.toString();
    const res = await serverFetch.get(
      `/organization-members/public/leadership${qs ? `?${qs}` : ""}`,
    );
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getOrganizationMembers = async (
  organizationId: string,
  params?: Record<string, string | number | undefined>,
) => {
  try {
    const q = new URLSearchParams();
    if (params)
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.set(k, String(v));
      });
    const qs = q.toString();
    const res = await serverFetch.get(
      `/organization-members/organization/${organizationId}${qs ? `?${qs}` : ""}`,
    );
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getPublicOrganizationMembers = async (organizationId: string) => {
  try {
    const res = await serverFetch.get(
      `/organization-members/organization/${organizationId}/public`,
    );
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getMyMembership = async () => {
  try {
    const res = await serverFetch.get("/organization-members/me");
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const requestMembership = async (data: {
  organizationId: string;
  positionId?: string;
}) => {
  try {
    const res = await serverFetch.post("/organization-members/join", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const updateMemberStatus = async (
  id: string,
  data: { status: string },
) => {
  try {
    const res = await serverFetch.patch(`/organization-members/${id}/status`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const getOrganizationPositions = async () => {
  try {
    const res = await serverFetch.get("/organization-positions");
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const createPosition = async (data: {
  organizationId: string;
  positionName: string;
  positionOrder?: number;
  level?: string;
  positionStatus?: string;
}) => {
  try {
    const res = await serverFetch.post("/organization-positions", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const updatePosition = async (
  id: string,
  data: Record<string, unknown>,
) => {
  try {
    const res = await serverFetch.patch(`/organization-positions/${id}`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const deletePosition = async (id: string) => {
  try {
    const res = await serverFetch.delete(`/organization-positions/${id}`);
    return res.json();
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};
