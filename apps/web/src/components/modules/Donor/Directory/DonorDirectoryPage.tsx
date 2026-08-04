"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Phone,
  Search,
  Filter,
  Droplet,
  UserCheck,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import PageHeader from "@/components/shared/PageHeader/PageHeader";
import { useGetPublicDonorsQuery } from "@/redux/features/donors/donorsApi";
import { useGetBloodGroupsQuery } from "@/redux/features/blood/bloodApi";
import {
  useGetDivisionsQuery,
  useGetDistrictsQuery,
  useGetUpazilasQuery,
} from "@/redux/features/location/locationApi";
import type { Division } from "@/redux/features/location/locationApi";
import type { BloodGroup } from "@/redux/features/blood/bloodApi";
import type { Donor } from "@/redux/features/donors/donorsApi";

type DonorDirectoryPageProps = {
  initialDonors?: { data?: Donor[]; meta?: { total?: number } };
  initialDivisions?: Division[];
  initialBloodGroups?: BloodGroup[];
};

const DonorDirectoryPage = ({
  initialDonors,
  initialDivisions,
  initialBloodGroups,
}: DonorDirectoryPageProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [bloodGroupParam, setBloodGroupParam] = useState("any");
  const [availability, setAvailability] = useState("any");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [upazila, setUpazila] = useState("");
  const [limit, setLimit] = useState(12);

  const { data: bloodGroupsData } = useGetBloodGroupsQuery(undefined, {
    skip: !!initialBloodGroups?.length,
  });
  const bloodGroups = initialBloodGroups ?? bloodGroupsData?.data ?? [];
  const bloodGroupId =
    bloodGroupParam !== "any"
      ? bloodGroups.find((g) => g.groupName === bloodGroupParam)?.id
      : undefined;

  const { data: divisionsData } = useGetDivisionsQuery(undefined, {
    skip: !!initialDivisions?.length,
  });
  const divisions = initialDivisions ?? divisionsData?.data ?? [];
  const { data: districtsData } = useGetDistrictsQuery(
    division ? { divisionId: division } : undefined,
    { skip: !division },
  );
  const { data: upazilasData } = useGetUpazilasQuery(
    district ? { districtId: district } : undefined,
    { skip: !district },
  );

  const { data, isLoading, isFetching } = useGetPublicDonorsQuery({
    page: 1,
    limit,
    searchTerm: searchQuery || undefined,
    bloodGroupId,
    divisionId: division || undefined,
    districtId: district || undefined,
    upazilaId: upazila || undefined,
    availabilityStatus:
      availability === "available"
        ? "AVAILABLE"
        : availability === "busy"
          ? "UNAVAILABLE"
          : undefined,
  });

  const resolvedDonors = data ?? initialDonors;
  const donors = resolvedDonors?.data ?? [];
  const totalDonors = resolvedDonors?.meta?.total ?? donors.length;
  const loading = !resolvedDonors && isLoading;
  const hasMore = donors.length < totalDonors;

  const resetFilters = () => {
    setSearchQuery("");
    setBloodGroupParam("any");
    setAvailability("any");
    setDivision("");
    setDistrict("");
    setUpazila("");
    setLimit(12);
  };

  const availableCount = donors.filter(
    (d) => d.availabilityStatus === "AVAILABLE",
  ).length;

  return (
    <div className="min-h-screen bg-white pb-10 md:pb-16">
      <PageHeader
        icon={<UserCheck className="size-3.5" />}
        badgeText="Verified Donor Network"
        titleBase="Find a"
        titleSpan="Blood"
        titleSuffix="Donor"
        description="Search for verified blood donors across Bangladesh by location or blood group and connect with life-savers near you."
        stats={
          <>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-border/40">
              <span className="text-2xl font-black text-foreground">
                {donors.length.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-muted-foreground uppercase">
                Total Donors
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20">
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              <span className="text-2xl font-black text-primary">
                {availableCount.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-primary/60 uppercase">
                Available Now
              </span>
            </div>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-6 space-y-12">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setLimit(12);
              }}
              placeholder="Search by donor name..."
              className="pl-12 h-14 rounded-2xl border-border/40 focus:border-primary transition-all text-base"
            />
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto h-14 px-8 text-xs rounded-2xl bg-primary hover:bg-emerald-600 shadow-2xl shadow-primary/30 transition-all duration-300 font-black uppercase  text-white group">
                <Filter className="size-4 mr-2 text-white " />
                Advanced Filters
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-[2rem] p-8 gap-8 border-border/40 bg-white dark:bg-zinc-950">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                  Filter Donors
                </DialogTitle>
                <DialogDescription>
                  Narrow down your search by selecting specific areas, blood
                  groups, and availability.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground pl-1">
                    Blood Group
                  </label>
                  <Select
                    value={bloodGroupParam}
                    onValueChange={(value) => {
                      setBloodGroupParam(value);
                      setLimit(12);
                    }}
                  >
                    <SelectTrigger className="mt-2 w-full py-6 bg-zinc-50 dark:bg-zinc-900 border border-border/40 rounded-2xl px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 hover:border-primary/20 transition-all">
                      <SelectValue placeholder="Any Blood Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Blood Group</SelectItem>
                      {(bloodGroupsData?.data ?? []).map((group) => (
                        <SelectItem key={group.id} value={group.groupName}>
                          {group.groupName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground pl-1">
                    Availability
                  </label>
                  <Select
                    value={availability}
                    onValueChange={(value) => {
                      setAvailability(value);
                      setLimit(12);
                    }}
                  >
                    <SelectTrigger className="mt-2 w-full py-6 bg-zinc-50 dark:bg-zinc-900 border border-border/40 rounded-2xl px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 hover:border-primary/20 transition-all">
                      <SelectValue placeholder="Any Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Status</SelectItem>
                      <SelectItem value="available">Available Now</SelectItem>
                      <SelectItem value="busy">Busy / Recovering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground pl-1">
                    Division
                  </label>
                  <Select
                    value={division}
                    onValueChange={(v) => {
                      setDivision(v);
                      setDistrict("");
                      setUpazila("");
                      setLimit(12);
                    }}
                  >
                    <SelectTrigger className="mt-2 w-full py-6 bg-zinc-50 dark:bg-zinc-900 border border-border/40 rounded-2xl px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 hover:border-primary/20 transition-all">
                      <SelectValue placeholder="Select Division" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Division</SelectItem>
                      {divisions.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-muted-foreground pl-1">
                    District
                  </label>
                  <Select
                    value={district}
                    onValueChange={(v) => {
                      setDistrict(v);
                      setUpazila("");
                      setLimit(12);
                    }}
                    disabled={!division}
                  >
                    <SelectTrigger className="mt-2 w-full py-6 bg-zinc-50 dark:bg-zinc-900 border border-border/40 rounded-2xl px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 hover:border-primary/20 transition-all">
                      <SelectValue placeholder="Select District" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any District</SelectItem>
                      {(districtsData?.data ?? []).map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-black uppercase text-muted-foreground pl-1">
                    Upazila / Area
                  </label>
                  <Select
                    value={upazila}
                    onValueChange={(value) => {
                      setUpazila(value);
                      setLimit(12);
                    }}
                    disabled={!district}
                  >
                    <SelectTrigger className="mt-2 w-full py-6 bg-zinc-50 dark:bg-zinc-900 border border-border/40 rounded-2xl px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 hover:border-primary/20 transition-all">
                      <SelectValue placeholder="Select Upazila" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Upazila</SelectItem>
                      {(upazilasData?.data ?? []).map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="h-12 px-8 rounded-xl bg-primary text-white font-black uppercase  text-xs shadow-lg shadow-primary/20 transition-transform">
                Apply Filters
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="size-10 animate-spin text-primary" />
          </div>
        )}

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {!loading &&
            donors.map((donor, i) => (
              <motion.div
                key={donor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/donor/${donor.id}`}
                  className="group block h-full"
                >
                  <div className="h-full border-border/50 rounded-[2.5rem] overflow-hidden border hover:shadow-premium transition-all duration-500 hover:border-primary/20 flex flex-col">
                    <div className="p-8 space-y-6 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="relative">
                          <div className="relative size-20 rounded-full border-4 border-background overflow-hidden shadow-sm transition-transform duration-300 bg-primary/10">
                            {donor.profilePhoto ? (
                              <Image
                                src={donor.profilePhoto}
                                alt={donor.fullName}
                                fill
                                className="object-cover rounded-full"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-2xl font-black text-primary">
                                {donor.fullName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 size-6 rounded-full border-4 border-background shadow-sm ${donor.availabilityStatus === "AVAILABLE" ? "bg-emerald-500" : "bg-amber-500"}`}
                          />
                        </div>
                        <div className="size-14 rounded-2xl bg-primary/10 flex flex-col items-center justify-center text-primary border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
                          <Droplet className="size-5 fill-current mb-0.5" />
                          <span className="text-xs font-black leading-none">
                            {donor.bloodGroup?.groupName}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-foreground tracking-tight line-clamp-1">
                          {donor.fullName}
                        </h3>
                        <p className="text-xs font-bold text-primary uppercase ">
                          {donor.availabilityStatus === "AVAILABLE"
                            ? "Available"
                            : "Busy/Recovering"}
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-start gap-3">
                          <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                          <span className="text-sm font-medium text-muted-foreground/80 leading-snug">
                            {donor.district?.name ?? "—"}
                          </span>
                        </div>
                        <div className="flex items-start gap-3">
                          <Phone className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                          <span className="text-sm font-medium text-muted-foreground/80 leading-snug">
                            {donor.phoneVerified ? "Phone verified" : "Phone not verified"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 pt-0 mt-auto">
                      <div className="w-full pt-6 border-t border-border/40 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60">
                            Last Donation
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {donor.lastDonationDate
                              ? new Date(
                                donor.lastDonationDate,
                              ).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          className="rounded-xl font-bold border-border/50 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all"
                        >
                          Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
        </div>

        {hasMore && (
          <div className="flex justify-center">
            <Button
              type="button"
              disabled={isFetching}
              onClick={() => setLimit((prev) => prev + 12)}
              className="w-full sm:w-auto h-16 px-10 text-xs rounded-2xl bg-primary hover:bg-emerald-600 shadow-2xl shadow-primary/30 transition-all duration-300 font-black uppercase  text-white group"
            >
              {isFetching
                ? "Loading..."
                : `Load More Donors (${donors.length}/${totalDonors})`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDirectoryPage;
