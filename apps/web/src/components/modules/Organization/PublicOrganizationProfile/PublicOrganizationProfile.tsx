"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import ProfileStats from "./ProfileStats";
import Link from "next/link";
import TeamCard from "@/components/modules/Home/OurTeam/TeamCard";
import RequestBloodDialog from "./RequestBloodDialog";
import {
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Share2,
  Globe,
  Droplets,
} from "lucide-react";
import WorkCard from "@/components/modules/Home/OurWork/WorkCard";
import GalleryCard from "@/components/modules/Gallery/GalleryCard";
import BloodInventory from "./BloodInventory";
import { useMemo } from "react";
import {
  useGetOrganizationBySlugQuery,
  useGetOrganizationPublicStatsQuery,
  useGetPublicOrganizationMembersQuery,
} from "@/redux/features/organizations/organizationsApi";
import { useGetPublicPostsQuery } from "@/redux/features/posts/postsApi";
import { useGetAllGalleriesQuery } from "@/redux/features/gallery/galleryApi";
import { mapApiPostToLegacy } from "@/lib/post";
import { mapGalleryItemToAsset } from "@/lib/gallery";
import type {
  Organization,
  OrganizationMember,
} from "@/redux/features/organizations/organizationsApi";
import type { Post } from "@/redux/features/posts/postsApi";

const PublicOrganizationProfile = ({
  slug,
  initialOrganization,
  initialMembers,
  initialPosts,
}: {
  slug: string;
  initialOrganization?: Organization | null;
  initialMembers?: OrganizationMember[];
  initialPosts?: Post[];
}) => {
  const { data: orgData, isLoading: orgsLoading } =
    useGetOrganizationBySlugQuery(slug, {
      skip: !!initialOrganization,
    });
  const organization = orgData?.data ?? initialOrganization ?? null;

  const { data: membersData, isLoading: membersLoading } =
    useGetPublicOrganizationMembersQuery(organization?.id ?? "", {
      skip: !organization?.id || !!initialMembers?.length,
    });

  const { data: postsData, isLoading: postsLoading } = useGetPublicPostsQuery(
    { limit: 50, organizationId: organization?.id, isWork: true },
    { skip: !organization?.id || !!initialPosts?.length },
  );

  const { data: galleriesData, isLoading: galleriesLoading } =
    useGetAllGalleriesQuery(
      {
        organizationId: organization?.id,
        limit: 12,
      },
      { skip: !organization?.id },
    );

  const { data: statsData, isLoading: statsLoading } =
    useGetOrganizationPublicStatsQuery(organization?.id ?? "", {
      skip: !organization?.id,
    });

  const members = useMemo(
    () =>
      (membersData?.data ?? initialMembers ?? []).map((m) => ({
        id: m.id,
        name: m.donor.fullName,
        role: m.position.positionName,
      })),
    [membersData, initialMembers],
  );

  const works = useMemo(
    () =>
      (postsData?.data ?? initialPosts ?? []).map((p) =>
        mapApiPostToLegacy(p, organization?.name ?? ""),
      ),
    [postsData, initialPosts, organization?.name],
  );

  const galleryAssets = useMemo(
    () => (galleriesData?.data ?? []).map(mapGalleryItemToAsset),
    [galleriesData?.data],
  );

  const loading =
    (orgsLoading && !initialOrganization) ||
    (membersLoading && !initialMembers?.length) ||
    (postsLoading && !initialPosts?.length) ||
    galleriesLoading ||
    statsLoading;

  if (!organization && !orgsLoading && !initialOrganization) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 mt-20">
        <p className="text-xl font-black uppercase tracking-tighter">
          Organization Not Found
        </p>
        <Link href="/organization">
          <Button variant="outline" className="rounded-xl">
            Browse Organizations
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-50/50 dark:bg-zinc-950/30 mt-14 py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-6 relative z-20 space-y-12">
        {/* Dashboard Grid Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Identity Card */}
          <div className="lg:col-span-8 p-6 rounded-xl bg-white dark:bg-zinc-900 border border-border/40 space-y-10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                <div className="relative size-40 rounded-xl border-4 border-background overflow-hidden shadow-2xl transition-transform duration-500 bg-zinc-50 dark:bg-zinc-800">
                  {organization?.logo ? (
                    <Image
                      src={organization.logo}
                      alt={organization?.name ?? "Organization"}
                      fill
                      className="object-cover rounded-xl"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-5xl font-black text-primary">
                      {(organization?.name ?? "Organization")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-3 -right-3 size-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center border-4 border-background shadow-xl">
                  <ShieldCheck className="size-6" />
                </div>
              </div>

              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="space-y-2">
                  <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tighter leading-none uppercase ">
                    {organization?.name ?? "Organization"}
                  </h2>
                </div>
                <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-xl ">
                  {organization?.description ??
                    organization?.address ??
                    "Verified blood organization on the BD Blood network."}
                </p>
              </div>
            </div>

            <div className="flex flex-row flex-wrap gap-5 mt-6">
              <RequestBloodDialog
                organizationId={organization?.id}
                divisionId={organization?.divisionId}
                districtId={organization?.districtId}
                upazilaId={organization?.upazilaId}
              />
              <Button
                variant="outline"
                className="w-full sm:w-auto h-14 px-6 rounded-2xl border-border/40 font-black text-xs uppercase  flex items-center gap-2"
              >
                <Share2 className="size-4 opacity-40" />
                Share Organization
              </Button>
            </div>
          </div>

          {/* Live Comms Card */}
          <div className="lg:col-span-4 p-8 rounded-xl bg-zinc-950 text-white relative overflow-hidden group flex flex-col justify-between border border-white/5 shadow-2xl">
            <Zap className="absolute -top-6 -right-6 size-48 text-white/5 -rotate-12 transition-transform duration-1000 group-hover:scale-110 h-full" />
            <div className="relative z-10 space-y-4 px-2 h-full">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary animate-pulse" />
                Live Notice Feed
              </h4>
              <div className="h-full flex flex-col justify-center">
                <Carousel
                  className="w-full h-full relative"
                  opts={{ loop: true }}
                >
                  <CarouselContent>
                    {works.length > 0 ? (
                      works.slice(0, 5).map((notice) => (
                        <CarouselItem className="flex items-center" key={notice.id}>
                          <p className="text-xl font-bold tracking-tight opacity-80 leading-snug line-clamp-3">
                            {notice.title}
                          </p>
                        </CarouselItem>
                      ))
                    ) : (
                      <CarouselItem className="flex items-center">
                        <p className="text-sm font-bold text-white/60">
                          No published organization notices yet.
                        </p>
                      </CarouselItem>
                    )}
                  </CarouselContent>
                </Carousel>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Registry Component */}
        <ProfileStats
          memberCount={organization?._count?.members ?? members.length}
          workCount={works.length}
          activeDonors={statsData?.data.activeDonors}
          requestsFulfilled={statsData?.data.requestsFulfilled}
          verifiedDonations={statsData?.data.verifiedDonations}
        />

        {organization?.id && (
          <BloodInventory organizationId={organization.id} />
        )}

        {/* Global Feed Section */}
        <section className=" pt-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 text-center md:text-left">
            <div className="space-y-2">
              <h3 className="text-2xl md:text-4xl font-black text-foreground tracking-tighter uppercase leading-none ">
                Donor <span className="text-primary">Posts</span>
              </h3>
              <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-xl ">
                Explore verified life-saver broadcast logs and regional mission
                briefings.
              </p>
            </div>
            <Link href={`/organization/${slug}/posts`}>
              <Button className="w-full sm:w-auto h-14 px-6 rounded-2xl font-black text-xs uppercase  bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                Explore Posts
                <ArrowUpRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>

          <div className="pt-4 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <Carousel className="w-full relative z-10 ">
              <CarouselContent className="-ml-8 py-10">
                {loading && works.length === 0 ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <CarouselItem
                      className="pl-8 sm:basis-1/2 lg:basis-1/3"
                      key={i}
                    >
                      <div className="aspect-[16/18] rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 animate-pulse border border-border/40 border-dashed" />
                    </CarouselItem>
                  ))
                ) : (
                  <>
                    {works.map((work, index) => (
                      <CarouselItem
                        className="pl-8 sm:basis-1/2 lg:basis-1/3"
                        key={work.id}
                      >
                        <WorkCard post={work} />
                      </CarouselItem>
                    ))}
                    {works.length === 0 && (
                      <div className="w-full py-12 flex flex-col items-center justify-center text-center opacity-40 ">
                        <p className="text-sm font-black uppercase ">
                          No mission reports archived yet
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CarouselContent>
            </Carousel>
          </div>
        </section>

        {(galleryAssets.length > 0 || galleriesLoading) && (
          <section className="space-y-8 pt-10">
            <div className="space-y-2 px-2 text-center md:text-left">
              <h3 className="text-2xl md:text-4xl font-black text-foreground tracking-tighter uppercase">
                Organization <span className="text-primary">Gallery</span>
              </h3>
              <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                Published moments managed by this organization.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {galleriesLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-[4/5] animate-pulse rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800"
                  />
                ))
                : galleryAssets.map((asset) => (
                  <GalleryCard key={asset.id} asset={asset} />
                ))}
            </div>
          </section>
        )}

        {/* Elite Command Section */}
        <div className="space-y-10">
          <div className="space-y-2 px-2 text-center md:text-left">
            <h3 className="text-2xl md:text-4xl font-black text-foreground tracking-tighter uppercase ">
              Organization <span className="text-primary">Team</span>
            </h3>
            <p className="text-muted-foreground font-medium text-lg leading-relaxed ">
              Explore the central coordinating personnel authorized for regional
              social works.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {members.map((member, i) => (
              <TeamCard
                key={member.id}
                name={member.name}
                position={member.role}
                image={(membersData?.data ?? initialMembers ?? []).find(
                  (item) => item.id === member.id,
                )?.donor.profilePhoto}
                slug={(membersData?.data ?? initialMembers ?? []).find(
                  (item) => item.id === member.id,
                )?.donor.slug ?? member.id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicOrganizationProfile;
