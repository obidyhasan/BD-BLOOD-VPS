import type {
  MedicalAd,
  MedicalInstitution,
} from "@/redux/features/medicalInstitutions/medicalInstitutionsApi";

export type InstitutionUI = {
  id: string;
  slug: string;
  name: string;
  type: string;
  phone: string;
  division: string;
  district: string;
  upazila: string;
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  status: string;
  image?: string;
  description?: string;
  doctorsCount: number;
  specialists?: {
    name: string;
    specialist: string;
    schedule: string;
    contact: string;
  }[];
  departments?: string[];
  emergencyServices?: string[];
};

export type AdUI = {
  id: string;
  medicalId: string;
  medicalName: string;
  medicalSlug: string;
  title: string;
  description: string;
  phone: string;
  address: string;
  bannerImage: string;
  ctaText: string;
  status: "Active" | "Paused";
  division: string;
  district: string;
  upazila: string;
};

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function mapInstitutionToUI(inst: MedicalInstitution): InstitutionUI {
  return {
    id: inst.id,
    slug: inst.slug ?? toSlug(inst.name),
    name: inst.name,
    type: inst.type ?? "Hospital",
    phone: inst.phone,
    division: inst.division?.name ?? "",
    district: inst.district?.name ?? "",
    upazila: inst.upazila?.name ?? "",
    divisionId: inst.divisionId,
    districtId: inst.districtId,
    upazilaId: inst.upazilaId,
    status: inst.openStatus ?? "Open",
    image: inst.coverImage ?? inst.logo ?? undefined,
    description: undefined,
    doctorsCount: inst.doctors?.length ?? 0,
  };
}

export function mapAdToUI(ad: MedicalAd): AdUI {
  const instName = ad.institution?.name ?? "";
  const instSlug = ad.institution?.slug ?? toSlug(instName);
  return {
    id: ad.id,
    medicalId: ad.institutionId,
    medicalName: instName,
    medicalSlug: instSlug,
    title: instName,
    description: ad.title,
    phone: ad.institution?.phone ?? "",
    address: ad.institution?.address ?? "",
    bannerImage: ad.imageUrl,
    ctaText: "Visit Medical",
    status: ad.status === "ACTIVE" ? "Active" : "Paused",
    division: "",
    district: "",
    upazila: "",
  };
}
