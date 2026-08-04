"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  HeartHandshake,
  Images,
  MoveLeft,
  Share2,
  Calendar,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useGetGalleryBySlugQuery } from "@/redux/features/gallery/galleryApi";
import type { GalleryItem } from "@/redux/features/gallery/galleryApi";
import { mapGalleryItemToAsset } from "@/lib/gallery";
import { notFound } from "next/navigation";

interface GalleryDetailsPageProps {
  slug: string;
  initialItem?: GalleryItem | null;
}

const GalleryDetailsPage = ({ slug, initialItem }: GalleryDetailsPageProps) => {
  const { data, isLoading: loading } = useGetGalleryBySlugQuery(slug, {
    skip: !slug || !!initialItem,
  });

  const asset = useMemo(() => {
    const raw = data?.data ?? initialItem;
    return raw ? mapGalleryItemToAsset(raw) : null;
  }, [data, initialItem]);

  if (loading && !initialItem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="size-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!asset) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-white pb-10 md:pb-16">
      {/* Cinematic Header Block */}
      <div className="bg-gradient-to-b from-emerald-50/50 to-white  pt-28 pb-10 ">
        <div className="max-w-7xl mx-auto px-6 text-center md:text-left space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 max-w-3xl">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-full px-4 py-1.5 text-[10px] font-black uppercase  flex items-center gap-2">
                  <Images className="size-3" />
                  {asset.category}
                </Badge>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="size-3 opacity-40" />
                  <span className="text-[10px] font-black uppercase  opacity-40">
                    {asset.date}
                  </span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tighter leading-[1.1] uppercase">
                {asset.title}
              </h1>
              {asset.description && (
                <p className="text-muted-foreground text-base md:text-lg font-medium leading-relaxed mt-4">
                  {asset.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button className="rounded-2xl h-12 px-6 font-black bg-primary text-xs uppercase  text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                <Share2 className="size-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Main Feature Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <figure className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] rounded-[3rem] overflow-hidden border-4 border-white shadow-premium group bg-zinc-100">
            <Image
              src={asset.img}
              alt={asset.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </figure>
        </motion.div>
      </div>
    </div>
  );
};

export default GalleryDetailsPage;
