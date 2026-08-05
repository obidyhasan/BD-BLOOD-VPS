"use server";

import { serverFetch } from "@/helper/server-fetch";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";

export const getAllInstitutions = async (
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
      `/medical-institutions${qs ? `?${qs}` : ""}`,
    );
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getSingleInstitution = async (id: string) => {
  try {
    const res = await serverFetch.get(`/medical-institutions/${id}`);
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const getInstitutionBySlug = async (slug: string) => {
  try {
    const res = await serverFetch.get(`/medical-institutions/by-slug/${slug}`);
    return res.json();
  } catch {
    return { success: false, data: null };
  }
};

export const createInstitution = async (data: FormData) => {
  try {
    const res = await serverFetch.post("/medical-institutions", { body: data });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.MEDICAL_INSTITUTIONS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const updateInstitution = async (id: string, data: FormData) => {
  try {
    const res = await serverFetch.patch(`/medical-institutions/${id}`, {
      body: data,
    });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.MEDICAL_INSTITUTIONS, {});
      revalidateTag(CACHE_TAGS.MEDICAL_INSTITUTION(id), {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const deleteInstitution = async (id: string) => {
  try {
    const res = await serverFetch.delete(`/medical-institutions/${id}`);
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.MEDICAL_INSTITUTIONS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const getAllDoctors = async (
  params?: Record<string, string | number | boolean | undefined>,
) => {
  try {
    const q = new URLSearchParams();
    if (params)
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) q.set(k, String(v));
      });
    const qs = q.toString();
    const res = await serverFetch.get(`/doctors${qs ? `?${qs}` : ""}`);
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getAllMedicalInfos = async (
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
      `/medical-informations${qs ? `?${qs}` : ""}`,
    );
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const getDoctorsByInstitution = async (institutionId: string) => {
  try {
    const res = await serverFetch.get(
      `/doctors?institutionId=${institutionId}`,
    );
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const createDoctor = async (data: Record<string, unknown>) => {
  try {
    const res = await serverFetch.post("/doctors", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.DOCTORS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const updateDoctor = async (
  id: string,
  data: Record<string, unknown>,
) => {
  try {
    const res = await serverFetch.patch(`/doctors/${id}`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.DOCTORS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const deleteDoctor = async (id: string) => {
  try {
    const res = await serverFetch.delete(`/doctors/${id}`);
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.DOCTORS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const getMedicalInfosByInstitution = async (institutionId: string) => {
  try {
    const res = await serverFetch.get(
      `/medical-informations?institutionId=${institutionId}`,
    );
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const createMedicalInfo = async (data: Record<string, unknown>) => {
  try {
    const res = await serverFetch.post("/medical-informations", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.MEDICAL_INFOS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const updateMedicalInfo = async (
  id: string,
  data: Record<string, unknown>,
) => {
  try {
    const res = await serverFetch.patch(`/medical-informations/${id}`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.MEDICAL_INFOS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const deleteMedicalInfo = async (id: string) => {
  try {
    const res = await serverFetch.delete(`/medical-informations/${id}`);
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.MEDICAL_INFOS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const getMedicalAds = async (
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
      `/medical-advertisements${qs ? `?${qs}` : ""}`,
      { cache: "no-store" },
    );
    return res.json();
  } catch {
    return { success: false, data: [] };
  }
};

export const createMedicalAd = async (data: Record<string, unknown>) => {
  try {
    const res = await serverFetch.post("/medical-advertisements", {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.MEDICAL_ADS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const updateMedicalAd = async (
  id: string,
  data: Record<string, unknown>,
) => {
  try {
    const res = await serverFetch.patch(`/medical-advertisements/${id}`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.MEDICAL_ADS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};

export const deleteMedicalAd = async (id: string) => {
  try {
    const res = await serverFetch.delete(`/medical-advertisements/${id}`);
    const result = await res.json();
    if (result.success) {
      revalidateTag(CACHE_TAGS.MEDICAL_ADS, {});
    }
    return result;
  } catch (e: unknown) {
    return { success: false, message: (e as Error).message };
  }
};
