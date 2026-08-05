"use client";

import Carousel from "@/components/shared/Carousel/Carousel";
import { useGetPublicAdsQuery } from "@/redux/features/medicalInstitutions/medicalInstitutionsApi";
import { mapAdToUI } from "@/lib/medical";
import { useMemo } from "react";
import type { MedicalAd } from "@/redux/features/medicalInstitutions/medicalInstitutionsApi";

type MedicalAdsProps = {
  initialAds?: MedicalAd[];
};

export default function MedicalAds({ initialAds }: MedicalAdsProps) {
  const { data, isLoading } = useGetPublicAdsQuery(undefined, {
    skip: !!initialAds?.length,
  });

  const ads = useMemo(
    () =>
      (initialAds ?? data?.data ?? [])
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
