"use client";

import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import GalleryCard from "@/components/modules/Gallery/GalleryCard";
import { useGetAllGalleriesQuery } from "@/redux/features/gallery/galleryApi";
import { mapGalleryItemToAsset } from "@/lib/gallery";
import { useMemo } from "react";
import type { GalleryItem } from "@/redux/features/gallery/galleryApi";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type GallerySectionProps = {
  initialGalleries?: GalleryItem[];
};

export default function GallerySection({ initialGalleries }: GallerySectionProps) {
  const { data, isLoading, isError, refetch } = useGetAllGalleriesQuery(
    { limit: 3, scope: "homepage" },
    { skip: !!initialGalleries?.length },
  );

  const assets = useMemo(
    () => (initialGalleries?.length ? initialGalleries : data?.data ?? []).map(mapGalleryItemToAsset),
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

  if (isError) return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="rounded-[2.5rem] border border-dashed border-red-500/30 py-16 text-center">
        <AlertCircle className="mx-auto mb-3 size-8 text-red-500" />
        <p className="mb-4 font-bold">Gallery highlights could not be loaded.</p>
        <Button variant="outline" onClick={() => void refetch()}><RefreshCw className="mr-2 size-4" />Try again</Button>
      </div>
    </section>
  );

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
