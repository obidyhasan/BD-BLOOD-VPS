"use client";

import Carousel from "@/components/shared/Carousel/Carousel";
import { useGetPublicAdsQuery } from "@/redux/features/medicalInstitutions/medicalInstitutionsApi";
import { mapAdToUI } from "@/lib/medical";
import { useMemo } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MedicalAd } from "@/redux/features/medicalInstitutions/medicalInstitutionsApi";

type MedicalAdsProps = {
  initialAds?: MedicalAd[];
};

export default function MedicalAds({ initialAds }: MedicalAdsProps) {
  const { data, isLoading, isError, refetch } = useGetPublicAdsQuery(undefined, {
    skip: !!initialAds?.length,
  });

  const ads = useMemo(
    () =>
      (initialAds?.length ? initialAds : data?.data ?? [])
        .filter((ad) => ad.status === "ACTIVE")
        .map(mapAdToUI),
    [initialAds, data],
  );

  const loading = !initialAds?.length && isLoading;

  if (loading) return (
    <div className="py-10 max-w-7xl mx-auto px-6">
      <div className="h-[300px] md:h-[400px] w-full rounded-[2rem] bg-zinc-50 animate-pulse border border-border/40" />
    </div>
  );

  if (isError) return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="rounded-[2rem] border border-dashed border-red-500/30 py-14 text-center">
        <AlertCircle className="mx-auto mb-3 size-8 text-red-500" />
        <p className="mb-4 font-bold">Medical advertisements could not be loaded.</p>
        <Button variant="outline" onClick={() => void refetch()}><RefreshCw className="mr-2 size-4" />Try again</Button>
      </div>
    </div>
  );

  if (ads.length === 0) return null;

  return (
    <div>
      <div className="py-10 max-w-7xl mx-auto px-6">
        <Carousel
          carouselData={ads}
          showDots={false}
          height={{
            mobile: "h-[300px]",
            tablet: "md:h-[350px]",
            desktop: "lg:h-[400px]",
          }}
        />
      </div>
    </div>
  );
}
