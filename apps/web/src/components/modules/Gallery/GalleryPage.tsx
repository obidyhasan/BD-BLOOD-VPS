"use client";

import { useState, useMemo } from "react";
import GalleryCard from "./GalleryCard";
import { motion } from "motion/react";
import { Camera, Image as ImageIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader/PageHeader";
import { useGetAllGalleriesQuery } from "@/redux/features/gallery/galleryApi";
import { mapGalleryItemToAsset } from "@/lib/gallery";
import type { GalleryItem } from "@/redux/features/gallery/galleryApi";

type GalleryListResponse = {
  success?: boolean;
  data?: GalleryItem[];
};

type GalleryPageProps = {
  initialData?: GalleryListResponse;
};

const GalleryPage = ({ initialData }: GalleryPageProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(6);

  const { data, isLoading } = useGetAllGalleriesQuery(
    { limit: 100, scope: "homepage" },
    { skip: !!initialData?.data?.length },
  );
  const assets = useMemo(
    () => (initialData?.data ?? data?.data ?? []).map(mapGalleryItemToAsset),
    [initialData, data],
  );
  const loading = !initialData?.data?.length && isLoading;

  const filteredAssets = useMemo(() => {
    const result = assets.filter(
      (a) =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.category.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [assets, searchQuery, sortOrder]);

  const paginatedAssets = useMemo(() => {
    return filteredAssets.slice(0, visibleCount);
  }, [filteredAssets, visibleCount]);

  return (
    <div className="min-h-screen bg-white pb-10 md:pb-16">
      <PageHeader
        icon={<Camera className="size-3.5" />}
        badgeText="Photo Gallery"
        titleBase="Our"
        titleSpan="Captured"
        titleSuffix="Moments"
        description="Photos from our blood donation drives, community events, and life-saving missions across Bangladesh."
      />

      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search moments, events, or categories..."
              className="pl-12 h-14 rounded-2xl border-border/40 focus:border-primary transition-all text-base font-medium shadow-sm"
            />
          </div>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger
              className="w-full md:w-max min-w-[200px] py-6 bg-zinc-50 border border-primary/5 rounded-2xl px-5 text-sm font-bold 
      focus:ring-4 focus:ring-primary/10 hover:border-primary/20 transition-all"
            >
              <SelectValue placeholder="Sort by Newest" />
            </SelectTrigger>
            <SelectContent className="rounded-xl p-2 border-border/40">
              <SelectItem
                value="newest"
                className="font-bold text-sm py-3 cursor-pointer rounded-lg"
              >
                Newest First
              </SelectItem>
              <SelectItem
                value="oldest"
                className="font-bold text-sm py-3 cursor-pointer rounded-lg"
              >
                Oldest First
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading &&
            Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="aspect-[4/5] rounded-[2.5rem] bg-zinc-50 animate-pulse border-4 border-white"
              />
            ))}

          {!loading && paginatedAssets.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-40">
              <ImageIcon className="size-16 mb-4 stroke-1" />
              <p className="text-xl font-black uppercase tracking-tighter">
                No Moments Found
              </p>
              <p className="text-xs font-bold mt-1">
                Try adjusting your filters or search query.
              </p>
            </div>
          )}

          {!loading &&
            paginatedAssets.map((asset, idx) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                viewport={{ once: true }}
              >
                <GalleryCard asset={asset} />
              </motion.div>
            ))}
        </div>

        {filteredAssets.length > visibleCount && (
          <div className="flex justify-center">
            <Button
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="w-full sm:w-auto h-16 px-10 text-xs rounded-2xl bg-primary hover:bg-emerald-600 shadow-2xl shadow-primary/30 transition-all duration-300 font-black uppercase  text-white group"
            >
              Load More Moments
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryPage;
