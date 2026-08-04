"use client";
import { useState, useMemo } from "react";

import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import {
  Search,
  Filter,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DonorCard from "./DonorCard";
import { Button } from "@/components/ui/button";
import { useGetPublicDonorsQuery } from "@/redux/features/donors/donorsApi";
import { useGetBloodGroupsQuery } from "@/redux/features/blood/bloodApi";
import type { DonorCardModel } from "./donorTypes";

const PAGE_SIZE = 12;

const DonorPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>("All");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: bloodGroupsData } = useGetBloodGroupsQuery();
  const bloodGroupId =
    selectedBloodGroup !== "All"
      ? bloodGroupsData?.data?.find((g) => g.groupName === selectedBloodGroup)
        ?.id
      : undefined;

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedBloodGroup !== "All" ||
    availabilityFilter !== "All";

  const { data, isLoading, isFetching } = useGetPublicDonorsQuery({
    page: currentPage,
    limit: PAGE_SIZE,
    searchTerm: searchQuery.trim() || undefined,
    bloodGroupId,
    availabilityStatus:
      availabilityFilter === "available"
        ? "AVAILABLE"
        : availabilityFilter === "unavailable"
          ? "UNAVAILABLE"
          : undefined,
  });

  const donors: DonorCardModel[] = useMemo(
    () =>
      (data?.data ?? []).map((d) => ({
        id: d.id,
        name: d.fullName,
        bloodGroup: d.bloodGroup?.groupName ?? "—",
        phone: d.phoneVerified ? "Verified phone" : "Phone not verified",
        district: d.district?.name ?? "—",
        available: d.availabilityStatus === "AVAILABLE",
        accountStatus: "active",
        lastDonationDate: d.lastDonationDate ?? undefined,
      })),
    [data],
  );

  const totalPages = Math.max(
    1,
    Math.ceil((data?.meta?.total ?? donors.length) / PAGE_SIZE),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <DashboardHeader
          variant="clinical"
          title="Donor Network"
          subtitle="Browse verified donors and see who is available right now."
          badge="Verified Donors"
        />

        <div className="flex flex-wrap items-center gap-4">
          <div className="py-2 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-border/40 shadow-premium flex items-center gap-4">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40">
                Matching Donors
              </p>
              <p className="text-xl font-black tracking-tighter">
                {(data?.meta?.total ?? donors.length).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-[2rem] border border-border/40 bg-white/70 p-4 shadow-premium dark:bg-zinc-900/70 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
          <Input
            placeholder="Search donors by name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-12 h-14 rounded-2xl border-border/40 bg-background/80 font-bold"
          />
          {isFetching && !isLoading && (
            <Loader2 className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary" />
          )}
        </div>
        <Select
          value={selectedBloodGroup}
          onValueChange={(value) => {
            setSelectedBloodGroup(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-14 w-full rounded-2xl border-border/40 bg-background/80 font-black md:w-40">
            <Filter className="mr-2 size-4 text-primary" />
            <SelectValue placeholder="Blood Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Groups</SelectItem>
            {(bloodGroupsData?.data ?? []).map((g) => (
              <SelectItem key={g.id} value={g.groupName}>
                {g.groupName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={availabilityFilter}
          onValueChange={(value) => {
            setAvailabilityFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-14 w-full rounded-2xl border-border/40 bg-background/80 font-black md:w-40">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="unavailable">Unavailable</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          disabled={!hasActiveFilters}
          onClick={() => {
            setSearchQuery("");
            setSelectedBloodGroup("All");
            setAvailabilityFilter("All");
            setCurrentPage(1);
          }}
          className="h-14 rounded-2xl border-border/40 px-5 font-black uppercase  text-[10px]"
        >
          <RotateCcw className="size-4" />
          Reset
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-10 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {donors.map((donor, index) => (
              <DonorCard key={donor.id} donor={donor} index={index} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-xs font-black uppercase  text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {!isLoading && donors.length === 0 && (
        <div className="text-center py-16 text-muted-foreground font-medium">
          No donors match your filters.
        </div>
      )}
    </div>
  );
};

export default DonorPage;
