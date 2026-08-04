"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Plus } from "lucide-react";
import Link from "next/link";

import { heroContent, formatStatCount } from "@/lib/siteContent";
import { useGetPublicStatsQuery } from "@/redux/features/analytics/analyticsApi";
import type { PublicStats } from "@/redux/features/analytics/analyticsApi";
import {
  useGetDivisionsQuery,
  useGetDistrictsQuery,
  useGetUpazilasQuery,
} from "@/redux/features/location/locationApi";
import type { Division } from "@/redux/features/location/locationApi";
import { useState, useMemo } from "react";
import { useGetAllOrganizationsQuery } from "@/redux/features/organizations/organizationsApi";
import { buildLocationOrgQueryParams } from "@/lib/organizationGeo";

type HeroProps = {
  initialStats?: PublicStats | null;
  initialDivisions?: Division[];
};

const Hero = ({ initialStats, initialDivisions }: HeroProps) => {
  const { data: statsData } = useGetPublicStatsQuery(undefined, {
    skip: !!initialStats,
  });
  const stats = initialStats ?? statsData?.data;
  const [divisionId, setDivisionId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [upazilaId, setUpazilaId] = useState("");

  const { data: divisionsData } = useGetDivisionsQuery(undefined, {
    skip: !!initialDivisions?.length,
  });
  const divisions = initialDivisions ?? divisionsData?.data ?? [];
  const { data: districtsData } = useGetDistrictsQuery(
    divisionId ? { divisionId } : undefined,
    { skip: !divisionId },
  );
  const { data: upazilasData } = useGetUpazilasQuery(
    districtId ? { districtId } : undefined,
    { skip: !districtId },
  );

  const heroStats = stats
    ? [
      { value: formatStatCount(stats.donorsTotal), label: "Verified Donors" },
      { value: formatStatCount(stats.worksCount), label: "Success Stories" },
      {
        value: formatStatCount(stats.upazilasCovered),
        label: "Upazila Covered",
      },
    ]
    : [
      { value: "—", label: "Verified Donors" },
      { value: "—", label: "Success Stories" },
      { value: "—", label: "Upazila Covered" },
    ];

  const orgQueryParams = useMemo(
    () =>
      divisionId || districtId || upazilaId
        ? buildLocationOrgQueryParams({
          divisionId,
          districtId,
          upazilaId,
          limit: 1,
        })
        : null,
    [divisionId, districtId, upazilaId],
  );

  const { data: orgData, isFetching: orgFetching } =
    useGetAllOrganizationsQuery(orgQueryParams!, { skip: !orgQueryParams });

  const matchedOrg = orgData?.data?.[0];
  const searchHref = matchedOrg
    ? `/organization/${matchedOrg.id}`
    : "/organization";
  const canSearch = !!divisionId && !!matchedOrg && !orgFetching;

  return (
    <section className="max-w-7xl mx-auto relative w-full  py-10 mt-17">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="px-6">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary w-fit"
            >
              {/* <div className="size-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" /> */}
              <span className="text-[10px] font-black uppercase">
                {heroContent.badge}
              </span>
            </motion.div>

            <div className="space-y-8">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-7xl xl:text-8xl font-black text-foreground tracking-tighter leading-[0.85] uppercase "
              >
                {heroContent.title.line1}{" "}
                <span className="text-primary ">{heroContent.title.span1}</span>{" "}
                <br />
                {heroContent.title.line2}{" "}
                <span className="text-primary ">
                  {heroContent.title.span2}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="max-w-2xl text-md md:text-lg text-muted-foreground leading-relaxed font-semibold  border-l-4 border-primary/20 pl-4"
              >
                &quot;{heroContent.description}&quot;
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-wrap items-center gap-4 sm:gap-6"
            >
              <Link href="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-xs rounded-2xl bg-primary hover:bg-emerald-600 shadow-2xl shadow-primary/30 transition-all duration-300 font-black uppercase  text-white group"
                >
                  Become a Hero
                  <ArrowRight className="ml-3 size-5 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
              {/* <Link
                href="/register"
                className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] text-foreground hover:text-primary transition-colors group"
              >
                <div className="size-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <Plus className="size-5" />
                </div>
                Become a Hero
              </Link> */}
            </motion.div>

            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="pt-12 grid grid-cols-3 gap-4 sm:gap-10 border-t border-primary/5"
            >
              {heroStats.map((stat, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="text-3xl font-black text-foreground tracking-tighter uppercase  leading-none">
                    {stat.value}
                  </h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase  opacity-60">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Content: Search Widget */}
          <div className="lg:col-span-5 xl:col-span-4 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-8 shadow-[0_20px_60px_-40px_rgba(16,185,129,0.25)] border border-primary/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-12 -mt-12 blur-3xl opacity-50 transition-all group-hover:scale-125" />

                <div className="space-y-8 relative z-10">
                  <div className="space-y-2">
                    <h3 className="text-4xl font-black text-foreground tracking-tight leading-none uppercase">
                      Need Blood?
                    </h3>
                    <p className="text-xs text-primary font-black uppercase  bg-primary/5 inline-block px-3 py-1 rounded-full">
                      Fast-Response Registry
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase  text-muted-foreground ml-1">
                        Division
                      </label>

                      <Select
                        value={divisionId || undefined}
                        onValueChange={(v) => {
                          setDivisionId(v);
                          setDistrictId("");
                          setUpazilaId("");
                        }}
                      >
                        <SelectTrigger
                          className="w-full mt-2 py-6 bg-zinc-50 dark:bg-zinc-950 border border-primary/5 rounded-2xl px-5 text-sm font-bold 
      focus:ring-4 focus:ring-primary/10 hover:border-primary/20 transition-all"
                        >
                          <SelectValue placeholder="Select Division" />
                        </SelectTrigger>

                        <SelectContent className="rounded-xl border border-primary/10">
                          {divisions.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase  text-muted-foreground ml-1">
                        District
                      </label>

                      <Select
                        value={districtId || undefined}
                        onValueChange={(v) => {
                          setDistrictId(v);
                          setUpazilaId("");
                        }}
                        disabled={!divisionId}
                      >
                        <SelectTrigger
                          className="w-full mt-2 py-6 bg-zinc-50 dark:bg-zinc-950 border border-primary/5 rounded-2xl px-5 text-sm font-bold 
      focus:ring-4 focus:ring-primary/10 hover:border-primary/20 transition-all"
                        >
                          <SelectValue placeholder="Select District" />
                        </SelectTrigger>

                        <SelectContent className="rounded-xl border border-primary/10">
                          {(districtsData?.data ?? []).map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase  text-muted-foreground ml-1">
                        Upazila
                      </label>

                      <Select
                        value={upazilaId || undefined}
                        onValueChange={setUpazilaId}
                        disabled={!districtId}
                      >
                        <SelectTrigger
                          className="w-full mt-2 py-6 bg-zinc-50 dark:bg-zinc-950 border border-primary/5 rounded-2xl px-5 text-sm font-bold 
      focus:ring-4 focus:ring-primary/10 hover:border-primary/20 transition-all"
                        >
                          <SelectValue placeholder="Select Upazila" />
                        </SelectTrigger>

                        <SelectContent className="rounded-xl border border-primary/10">
                          {(upazilasData?.data ?? []).map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {canSearch ? (
                      <Link href={searchHref}>
                        <Button className="w-full h-16 rounded-2xl bg-primary hover:bg-emerald-600 text-white font-black uppercase  text-xs shadow-2xl shadow-primary/20 group mt-4 transition-all duration-500 uppercase">
                          Search Blood
                          <Search className="ml-3 size-5 group-hover:scale-125 transition-transform" />
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        disabled
                        className="w-full h-16 rounded-2xl bg-primary/40 text-white font-black uppercase  text-xs shadow-2xl shadow-primary/20 mt-4 uppercase cursor-not-allowed"
                      >
                        {orgFetching
                          ? "Finding Organization..."
                          : "Select Division to Search"}
                        <Search className="ml-3 size-5 opacity-50" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-8 -left-8 size-24 bg-primary/5 rounded-full blur-2xl" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
