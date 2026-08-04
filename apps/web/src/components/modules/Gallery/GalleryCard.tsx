"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Camera, ArrowRight } from "lucide-react";

import type { GalleryAssetUI } from "@/lib/gallery";

interface GalleryCardProps {
  asset: GalleryAssetUI;
}

const GalleryCard = ({ asset }: GalleryCardProps) => {
  return (
    <motion.div
      transition={{ duration: 0.4 }}
      className="group relative w-full aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 border-4 border-white dark:border-zinc-900 shadow-sm hover:shadow-premium transition-all"
    >
      <Link
        href={`/gallery/${asset.slug}`}
        className="block w-full h-full relative"
      >
        <Image
          src={asset.img}
          alt={asset.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8 flex flex-col justify-end z-10 transition-opacity duration-500">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[9px] font-black uppercase ">
              <Camera className="size-3" />
              {asset.category}
            </div>

            <h3 className="text-2xl font-black text-white leading-tight uppercase transition-colors line-clamp-2">
              {asset.title}
            </h3>
            {asset.description && (
              <p className="text-white/70 text-sm font-medium line-clamp-2 max-w-[90%] transition-opacity">
                {asset.description}
              </p>
            )}
          </div>

          <div className="absolute top-6 right-6 size-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="size-5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default GalleryCard;
