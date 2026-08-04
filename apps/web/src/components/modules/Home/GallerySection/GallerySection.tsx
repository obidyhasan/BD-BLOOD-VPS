"use client";

import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import GalleryCard from "@/components/modules/Gallery/GalleryCard";
import { useGetAllGalleriesQuery } from "@/redux/features/gallery/galleryApi";
import { mapGalleryItemToAsset } from "@/lib/gallery";
import { useMemo } from "react";
import type { GalleryItem } from "@/redux/features/gallery/galleryApi";

type GallerySectionProps = {
  initialGalleries?: GalleryItem[];
};

export default function GallerySection({ initialGalleries }: GallerySectionProps) {
  const { data, isLoading } = useGetAllGalleriesQuery(
    { limit: 3, scope: "homepage" },
    { skip: !!initialGalleries?.length },
  );

  const assets = useMemo(
    () => (initialGalleries ?? data?.data ?? []).map(mapGalleryItemToAsset),
    [initialGalleries, data],
  );

  const loading = !initialGalleries?.length && isLoading;

  if (loading) {
    return (
      <section className="py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/5] rounded-[2.5rem] bg-zinc-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (assets.length === 0) return null;

  return (
    <section className="py-10 md:py-16 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          title="Captured Moments"
          subtitle="Highlights from our blood drives, community events, and life-saving missions."
          button={{ text: "View Gallery", href: "/gallery", variant: "outline" }}
        />
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {assets.map((asset) => (
            <GalleryCard key={asset.id} asset={asset} />
          ))}
        </div>
      </div>
    </section>
  );
}
