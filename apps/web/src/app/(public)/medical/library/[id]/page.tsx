import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MedicalLibraryDetails from "@/components/modules/Medical/MedicalLibraryDetails";
import { buildEntityMetadata, notFoundMetadata } from "@/lib/metadata";
import { getPublicMedicalInfo } from "@/services/medicalInstitution";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = (await getPublicMedicalInfo(id))?.data;
  if (!article) return notFoundMetadata("Medical library article");

  return buildEntityMetadata({
    title: article.title,
    description: article.content,
    path: `/medical/library/${id}`,
  });
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = (await getPublicMedicalInfo(id))?.data;
  if (!article) notFound();

  return <MedicalLibraryDetails article={article} />;
}
