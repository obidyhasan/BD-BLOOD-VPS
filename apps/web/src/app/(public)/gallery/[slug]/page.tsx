import GalleryDetailsPage from "@/components/modules/Gallery/GalleryDetailsPage";
import { getGalleryBySlug } from "@/services/gallery";
import { buildEntityMetadata, notFoundMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> => {
  const { slug } = await params;
  const item = (await getGalleryBySlug(slug))?.data;
  if (!item) return notFoundMetadata("Gallery item");

  return buildEntityMetadata({
    title: item.title,
    description: item.description,
    image: item.coverImage ?? item.images?.[0],
    path: `/gallery/${item.slug ?? slug}`,
  });
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const res = await getGalleryBySlug(slug);

  return (
    <GalleryDetailsPage slug={slug} initialItem={res?.data ?? null} />
  );
}
