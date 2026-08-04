import MedicalDetailsPage from "@/components/modules/Medical/MedicalDetailsPage";
import { getInstitutionBySlug } from "@/services/medicalInstitution";
import { buildEntityMetadata, notFoundMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> => {
  const { slug } = await params;
  const institution = (await getInstitutionBySlug(slug))?.data;
  if (!institution) return notFoundMetadata("Medical institution");

  const locationBits = [
    institution.upazila?.name,
    institution.district?.name,
  ].filter(Boolean);

  return buildEntityMetadata({
    title: institution.name,
    description: institution.address
      ? `${institution.type ?? "Medical institution"} at ${institution.address}.`
      : locationBits.length
        ? `${institution.type ?? "Medical institution"} in ${locationBits.join(", ")}.`
        : undefined,
    image: institution.coverImage ?? institution.logo,
    path: `/medical/${institution.slug ?? slug}`,
  });
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const res = await getInstitutionBySlug(slug);

  return (
    <MedicalDetailsPage slug={slug} initialInstitution={res?.data ?? null} />
  );
}
