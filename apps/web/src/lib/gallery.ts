import type { GalleryItem } from "@/redux/features/gallery/galleryApi";

export type GalleryAssetUI = {
  id: string;
  title: string;
  slug: string;
  category: string;
  date: string;
  img: string;
  description?: string;
};

export function mapGalleryItemToAsset(item: GalleryItem): GalleryAssetUI {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    category: item.category ?? "General",
    date: new Date(item.createdAt).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    }),
    img: item.coverImage ?? item.images[0] ?? "",
    description: item.description ?? undefined,
  };
}
