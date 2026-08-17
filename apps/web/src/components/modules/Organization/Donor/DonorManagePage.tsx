"use client";

import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { useMemo } from "react";
import { DonorDataTable } from "./DonorDataTable";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { motion } from "motion/react";
import { useGetAffiliatedDonorsQuery } from "@/redux/features/organizations/organizationsApi";
import { useOrganizationDashboardContext } from "@/hooks/useOrganizationDashboardContext";

const DonorManagePage = () => {
  const { organizationId } = useOrganizationDashboardContext();
  const { data, isLoading, isError, refetch } = useGetAffiliatedDonorsQuery(organizationId, {
    skip: !organizationId,
  });

  const donors = useMemo(
    () =>
      (data?.data ?? []).map(({ donor }) => ({
        id: donor.id,
        slug: donor.id,
        name: donor.fullName,
        bloodGroup: donor.bloodGroup?.groupName ?? "—",
        phone: donor.phoneVerifiedAt ? (donor.phone ?? "Verified phone") : "Phone not verified",
        district: donor.district?.name ?? "—",
        lastDonationDate: donor.lastDonationDate ?? "",
        available: donor.availabilityStatus === "AVAILABLE",
        accountStatus:
          donor.accountStatus === "ACTIVE"
            ? ("active" as const)
            : donor.accountStatus === "SUSPENDED"
              ? ("suspended" as const)
              : ("deactive" as const),
      })),
    [data],
  );

  const exportLedger = () => {
    const escape = (value: string | boolean) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [
      ["Name", "Blood group", "Phone", "District", "Last donation", "Available"],
      ...donors.map((donor) => [donor.name, donor.bloodGroup, donor.phone, donor.district, donor.lastDonationDate, donor.available]),
    ];
    const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "organization-affiliated-donors.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-1 flex-col bg-zinc-50/50 dark:bg-zinc-950/30 space-y-8">
      <div className="@container/main flex flex-1 flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <DashboardHeader
            variant="clinical"
            title="Affiliated Donors"
            subtitle="Manage donors assigned to this Upazila organization separately from governance members."
            badge="Organization Affiliation"
          />

          <Button onClick={exportLedger} disabled={!donors.length} variant="outline" className="h-14 px-6 rounded-2xl border-border/40 bg-white dark:bg-zinc-900 font-black text-[10px] uppercase  flex items-center gap-3 hover:scale-105 transition-all">
            <Download className="size-4 opacity-40" />
            Export Ledger
          </Button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {isLoading ? (
            <div className="h-64 rounded-[3rem] border border-dashed border-border/40 animate-pulse bg-zinc-100 dark:bg-zinc-800" />
          ) : isError ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-[3rem] border border-dashed border-destructive/30 text-center">
              <p className="text-sm font-semibold text-destructive">Affiliated donors could not be loaded.</p>
              <Button variant="outline" onClick={() => void refetch()}>Try again</Button>
            </div>
          ) : (
            <DonorDataTable data={donors} />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DonorManagePage;
