"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useGetMyDonationsQuery } from "@/redux/features/bloodDonations/bloodDonationsApi";
import { format } from "date-fns";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { PostDialog } from "@/components/reusable/Donor/PostDialog";
import { EditProfileDialog } from "./EditProfileDialog";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  Award,
  Droplets,
  Heart,
  Users,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Star,
  Activity,
  Target,
} from "lucide-react";
import { motion } from "motion/react";
import PostCard from "@/components/reusable/Donor/PostCard";
import { mapApiPostToLegacy, type LegacyPost } from "@/lib/post";
import { DonationCountdown } from "@/components/reusable/Donor/DonationCountdown";
import { useGetPublicDonorBySlugQuery } from "@/redux/features/donors/donorsApi";
import {
  useGetMyPostsQuery,
  useGetPublicPostsQuery,
} from "@/redux/features/posts/postsApi";
import { Loader2 } from "lucide-react";
import { useGetMyAchievementsQuery } from "@/redux/features/achievements/achievementsApi";
import type { Donor } from "@/redux/features/donors/donorsApi";
import {
  isExternalProfilePhoto,
  resolveProfilePhoto,
} from "@/lib/profilePhoto";
import { DonationShareCard } from "./DonationShareCard";

// Maps the `icon` name stored on the Achievement record (seeded from the
// original hardcoded donorAchievements.ts) to the lucide icon + colors the
// cards render with. Preserves the exact styling of the 4 original badges;
// unrecognized icon names (future admin-added achievements) fall back to Award.
const ACHIEVEMENT_ICON_STYLES: Record<
  string,
  { icon: typeof Award; color: string; bg: string }
> = {
  Droplets: { icon: Droplets, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  Heart: { icon: Heart, color: "text-red-500", bg: "bg-red-500/10" },
  Activity: { icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" },
  Star: { icon: Star, color: "text-amber-500", bg: "bg-amber-500/10" },
};
const DEFAULT_ACHIEVEMENT_ICON_STYLE = {
  icon: Award,
  color: "text-primary",
  bg: "bg-primary/10",
};

const DonorProfile = ({
  isDashboard,
  slug,
  initialDonor,
  initialPosts,
}: {
  isDashboard: boolean;
  slug?: string;
  initialDonor?: Donor | null;
  initialPosts?: Parameters<typeof mapApiPostToLegacy>[0][];
}) => {
  const { data: meData } = useGetMeQuery(undefined, { skip: !isDashboard });
  const { data: donorData, isLoading: donorLoading } =
    useGetPublicDonorBySlugQuery(slug ?? "", {
      skip: !slug || isDashboard || !!initialDonor,
    });
  const { data: donationsData } = useGetMyDonationsQuery(undefined, {
    skip: !isDashboard,
  });
  const recentDonations = donationsData?.data?.slice(0, 3) ?? [];

  const donor = isDashboard
    ? meData?.data
    : (donorData?.data ?? initialDonor ?? null);
  const donationCount = donationsData?.data?.length ?? 0;
  const fulfilledUnits = (donationsData?.data ?? []).filter(
    (d) => d.verificationStatus === "VERIFIED",
  ).length;
  const { data: myAchievementsData } = useGetMyAchievementsQuery(undefined, {
    skip: !isDashboard,
  });
  const achievements = (myAchievementsData?.data ?? []).map((ach) => {
    const style =
      ACHIEVEMENT_ICON_STYLES[ach.icon] ?? DEFAULT_ACHIEVEMENT_ICON_STYLE;
    return {
      title: ach.title,
      desc: ach.description,
      icon: style.icon,
      color: style.color,
      bg: style.bg,
      unlocked: ach.unlocked,
      date: ach.unlockedAt
        ? new Date(ach.unlockedAt).getFullYear().toString()
        : undefined,
    };
  });

  const { data: myPostsData } = useGetMyPostsQuery(undefined, {
    skip: !isDashboard,
  });
  const { data: publicPostsData } = useGetPublicPostsQuery(
    { limit: 50, donorId: donor?.id },
    { skip: isDashboard || !!initialPosts?.length || !donor?.id },
  );

  const posts: LegacyPost[] = useMemo(() => {
    const donorId = donor?.id;
    if (isDashboard) {
      return (myPostsData?.data ?? []).map((p) => mapApiPostToLegacy(p));
    }
    const source =
      publicPostsData?.data ??
      (initialPosts as
        | Parameters<typeof mapApiPostToLegacy>[0][]
        | undefined) ??
      [];
    return source
      .filter(
        (p) => !donorId || p.donorId === donorId || p.donor?.id === donorId,
      )
      .map((p) => mapApiPostToLegacy(p));
  }, [isDashboard, myPostsData, publicPostsData, initialPosts, donor?.id]);

  const profilePhotoSrc = resolveProfilePhoto(donor?.profilePhoto);
  const donorInitial = donor?.fullName?.trim().charAt(0).toUpperCase() || "D";

  if (!isDashboard && slug && donorLoading && !initialDonor) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className={`space-y-12 animate-in fade-in duration-1000 ${isDashboard ? "w-full" : "max-w-7xl mx-auto py-10 md:py-16 mt-10 px-6"}`}
    >
      {/* Profile Header Block */}
      <section className="relative rounded-[3rem] overflow-hidden border border-border/50 bg-white dark:bg-zinc-900">
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent -z-10" />

        <div className="p-6 md:p-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:items-start justify-between">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-end">
              <div className="relative group">
                <div className="relative size-32 md:size-40 rounded-full border-4 border-background overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500">
                  {profilePhotoSrc ? (
                    <Image
                      key={donor?.profilePhoto ?? "default-profile"}
                      src={profilePhotoSrc}
                      alt={donor?.fullName ?? "Donor Profile"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 128px, 160px"
                      priority
                      unoptimized={isExternalProfilePhoto(profilePhotoSrc)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-5xl font-black text-primary">
                      {donorInitial}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 size-12 rounded-2xl bg-primary text-white flex flex-col items-center justify-center border-4 border-background shadow-xl">
                  <Droplets className="size-4 fill-current mb-0.5" />
                  <span className="text-[10px] font-black leading-none uppercase">
                    {donor?.bloodGroup?.groupName ?? "—"}
                  </span>
                </div>
              </div>

              <div className="text-center md:text-left space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-center md:justify-start gap-4">
                    <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tighter leading-none">
                      {donor?.fullName ?? "Donor"}
                    </h1>
                    <div className="hidden sm:block">
                      <Badge
                        variant="primary"
                        className="rounded-full px-3 py-1 text-[10px] font-black uppercase  shadow-xl shadow-primary/10"
                      >
                        Elite Life-Saver
                      </Badge>
                    </div>
                  </div>
                  <p className="text-primary font-bold tracking-wide uppercase text-xs">
                    {donor?.availabilityStatus === "AVAILABLE"
                      ? "Available Donor"
                      : "Currently Unavailable"}
                    {donor?.isVerified ? " • Verified" : ""}
                  </p>
                </div>

                <p className="text-muted-foreground font-medium max-w-xl leading-relaxed">
                  {donor?.bio ??
                    "Life is precious, and shared blood connects us all. Proud to be part of the BD BLOOD mission to save lives one pint at a time."}
                </p>
              </div>
            </div>

            {isDashboard && <EditProfileDialog />}
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-border/40">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-border/50 flex items-center justify-center text-primary ">
                <MapPin className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                  Location
                </span>
                <span className="text-sm font-bold text-foreground">
                  {[donor?.district?.name, donor?.division?.name]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-border/50 flex items-center justify-center text-primary ">
                <Phone className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                  {isDashboard ? "Emergency Contact" : "Phone Status"}
                </span>
                <span className="text-sm font-bold text-foreground">
                  {isDashboard
                    ? (meData?.data?.phone ?? "—")
                    : donor?.phoneVerified
                      ? "Verified"
                      : "Not verified"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-border/50 flex items-center justify-center text-primary ">
                <Mail className="size-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                  {isDashboard ? "Verified Email" : "Affiliation"}
                </span>
                <span className="text-sm font-bold text-foreground truncate">
                  {isDashboard
                    ? (meData?.data?.email ?? "—")
                    : (donorData?.data?.organization?.organization?.name ??
                      initialDonor?.organization?.organization?.name ??
                      "Local organization")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Eligibility Countdown */}
      {isDashboard && (
        <DonationCountdown
          lastDonationDate={
            donor?.lastDonationDate
              ? new Date(donor.lastDonationDate).toISOString().split("T")[0]
              : undefined
          }
          nextEligibleDonationDate={
            donor?.nextEligibleDonationDate
              ? new Date(donor.nextEligibleDonationDate)
                .toISOString()
                .split("T")[0]
              : undefined
          }
        />
      )}

      {/* Impact Stats Grid - REPLACED REVENUE SECTION */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {[
          {
            label: "Total Donations",
            val: String(donationCount),
            sub: "Records on file",
            icon: Droplets,
            color: "text-red-500",
            bg: "bg-red-500/10",
          },
          {
            label: "Verified Donations",
            val: String(fulfilledUnits),
            sub: "Confirmed units",
            icon: Heart,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Availability",
            val: donor?.availabilityStatus === "AVAILABLE" ? "Yes" : "No",
            sub: "Current status",
            icon: Award,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
          {
            label: isDashboard ? "Referrals" : "Network Posts",
            val: String(
              isDashboard && donor && "referralCount" in donor
                ? (donor.referralCount ?? 0)
                : posts.length,
            ),
            sub: isDashboard ? "Registered donors referred" : "Published activity",
            icon: isDashboard ? Users : Star,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="rounded-[2.5rem] border-border/40 overflow-hidden shadow-none hover:shadow-premium transition-all duration-300 bg-card group">
              <CardHeader className="p-8 pb-0">
                <div
                  className={`size-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  <stat.icon className="size-7" />
                </div>
                <CardDescription className="text-[10px] font-black uppercase text-muted-foreground ">
                  {stat.label}
                </CardDescription>
                <CardTitle className="text-4xl font-black text-foreground tracking-tighter mt-1">
                  {stat.val}
                </CardTitle>
              </CardHeader>
              <CardFooter className="p-8 pt-4">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground opacity-60">
                  <TrendingUp className="size-3 text-primary" />
                  {stat.sub}
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </section>

      {isDashboard && donor && (
        <DonationShareCard
          donorName={donor.fullName}
          profilePhoto={donor.profilePhoto}
          verifiedDonations={fulfilledUnits}
          achievement={achievements.find((item) => item.unlocked)?.title}
        />
      )}

      {/* Donor Achievements - NEW SECTION */}
      {isDashboard && (
        <section className="space-y-10">
          <div className="space-y-2 pl-2">
            <h3 className="text-2xl md:text-4xl font-black text-foreground tracking-tighter uppercase leading-none">
              Donor <span className="text-primary">Achievements</span>
            </h3>
            <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-xl">
              Your dedication to saving lives is recognized through these
              milestones. Keep inspiring others!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
            {achievements.map((ach, i) => (
              <motion.div
                key={ach.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className={`rounded-[3rem] border-border/40 shadow-none overflow-hidden h-full flex flex-col items-center justify-center p-8 text-center transition-all duration-500
                  ${!ach.unlocked
                      ? "opacity-40 grayscale bg-zinc-50 dark:bg-zinc-900/50"
                      : "bg-white dark:bg-zinc-950 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 group"
                    }`}
                >
                  <div
                    className={`size-24 rounded-[2rem] ${ach.bg} ${ach.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}
                  >
                    <ach.icon className="size-10" />
                  </div>
                  <div className="space-y-3 mb-6">
                    <h3 className="text-xl font-black uppercase tracking-tight text-foreground">
                      {ach.title}
                    </h3>
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed px-2">
                      {ach.desc}
                    </p>
                  </div>
                  {ach.date ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-black text-[9px] uppercase  px-5 py-1.5"
                    >
                      Unlocked {ach.date}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="rounded-full border-border/60 font-black text-[9px] uppercase  px-5 py-1.5 flex items-center gap-2 opacity-60"
                    >
                      <Target className="size-3" /> Milestone Locked
                    </Badge>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity (Dashboard Only) */}
      {isDashboard && recentDonations.length > 0 && (
          <section className="space-y-10">
            <div className="space-y-2 pl-2">
              <h3 className="text-2xl md:text-4xl font-black text-foreground tracking-tighter uppercase leading-none">
                Recent <span className="text-primary">Activity</span>
              </h3>
              <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-xl">
                A quick glance at your latest verified donation activity.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 mt-10">
              {recentDonations.length > 0 && (
                <Card className="rounded-[2.5rem] border-border/40 shadow-none overflow-hidden bg-white dark:bg-zinc-950 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xl font-black uppercase tracking-tight">
                      Donations
                    </h4>
                    <Link href="/dashboard/donor/donations">
                      <Button
                        variant="ghost"
                        className="text-xs font-bold uppercase  text-primary hover:bg-primary/10 rounded-full px-4"
                      >
                        View All
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {recentDonations.map((dn) => (
                      <div
                        key={dn.id}
                        className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border/40"
                      >
                        <div>
                          <p className="font-bold text-sm uppercase tracking-tight">
                            {dn.hospitalName ?? "Hospital"}
                          </p>
                          <p className="text-xs text-muted-foreground font-medium flex items-center gap-2 mt-1">
                            <Activity className="size-3" />{" "}
                            {format(new Date(dn.donationDate), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="rounded-full font-black text-[9px] uppercase  px-3 py-1 bg-white dark:bg-zinc-950 text-emerald-500 border-emerald-500/20"
                        >
                          1 Unit
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </section>
      )}

      {/* Social Feed Section */}
      <section className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 pl-2">
            <h3 className=" text-2xl md:text-4xl font-black text-foreground tracking-tighter uppercase leading-none">
              Explore <span className="text-primary">Posts</span>
            </h3>
            <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-xl">
              Share your donation journey, post urgent requirements, and inspire
              others in your circle.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isDashboard && <PostDialog />}
            {isDashboard ? (
              <Link href={"/dashboard/donor/posts"}>
                <Button className="w-full sm:w-auto h-14 px-6 rounded-2xl font-black text-xs uppercase  bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  My Posts <ArrowRight className="size-4" />
                </Button>
              </Link>
            ) : (
              <Link href={"/donor/post"}>
                <Button className="w-full sm:w-auto h-14 px-6 rounded-2xl font-black text-xs uppercase  bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  Explore Posts <ArrowRight className="size-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-48 h-48 bg-primary/20 rounded-full blur-[100px] -z-10" />
          <Carousel className="w-full">
            <CarouselContent className="-ml-8">
              {posts.map((post, index) => (
                <CarouselItem
                  className="pl-8 sm:basis-1/2 lg:basis-1/3"
                  key={post.id}
                >
                  <PostCard post={post} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </section>
    </div>
  );
};

export default DonorProfile;
