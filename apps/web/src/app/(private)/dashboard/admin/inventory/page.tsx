"use client";

import { useMemo, useState } from "react";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, AlertCircle, Clock, Droplets } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetAllInventoryQuery } from "@/redux/features/inventory/inventoryApi";
import {
  useGetDistrictsQuery,
  useGetDivisionsQuery,
  useGetUpazilasQuery,
} from "@/redux/features/location/locationApi";
import { useGetAllOrganizationsQuery } from "@/redux/features/organizations/organizationsApi";
import {
  formatInventoryUpdated,
  inventoryStockStatus,
  type InventoryStockStatus,
} from "@/lib/inventory";
import { OrganizationShortageModal } from "@/components/modules/Admin/Inventory/OrganizationShortageModal";

type InventoryItem = {
  id: string;
  bloodGroupId: string;
  group: string;
  units: number;
  updated: string;
  status: InventoryStockStatus;
};

const ALL_VALUE = "all";

const statusStyle = (s: string) =>
  s === "Available"
    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    : s === "Low"
      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
      : "bg-red-500/10 text-red-500 border-red-500/20";

export default function AdminInventoryPage() {
  const [divisionId, setDivisionId] = useState(ALL_VALUE);
  const [districtId, setDistrictId] = useState(ALL_VALUE);
  const [upazilaId, setUpazilaId] = useState(ALL_VALUE);
  const [organizationId, setOrganizationId] = useState(ALL_VALUE);
  const [showShortageModal, setShowShortageModal] = useState(false);

  const inventoryFilters = useMemo(
    () => ({
      limit: 8,
      divisionId: divisionId !== ALL_VALUE ? divisionId : undefined,
      districtId: districtId !== ALL_VALUE ? districtId : undefined,
      upazilaId: upazilaId !== ALL_VALUE ? upazilaId : undefined,
      organizationId: organizationId !== ALL_VALUE ? organizationId : undefined,
    }),
    [districtId, divisionId, organizationId, upazilaId],
  );

  const { data, isLoading: loading } =
    useGetAllInventoryQuery(inventoryFilters);
  const { data: divisionsData } = useGetDivisionsQuery();
  const { data: districtsData } = useGetDistrictsQuery(
    divisionId !== ALL_VALUE ? { divisionId, limit: 100 } : { limit: 100 },
  );
  const { data: upazilasData } = useGetUpazilasQuery(
    districtId !== ALL_VALUE ? { districtId, limit: 200 } : { limit: 200 },
  );
  const { data: organizationsData } = useGetAllOrganizationsQuery({
    limit: 500,
    adminView: true,
    divisionId: divisionId !== ALL_VALUE ? divisionId : undefined,
    districtId: districtId !== ALL_VALUE ? districtId : undefined,
    upazilaId: upazilaId !== ALL_VALUE ? upazilaId : undefined,
  });

  const inventory: InventoryItem[] = (data?.data ?? []).map((row) => ({
    id: row.id,
    bloodGroupId: row.bloodGroupId,
    group: row.bloodGroup.groupName,
    units: row.availableUnits,
    updated: formatInventoryUpdated(row.lastUpdated),
    status: inventoryStockStatus(row.availableUnits),
  }));

  const divisions = divisionsData?.data ?? [];
  const districts = districtsData?.data ?? [];
  const upazilas = upazilasData?.data ?? [];
  const organizations = organizationsData?.data ?? [];
  const filteredScope = [
    divisionId,
    districtId,
    upazilaId,
    organizationId,
  ].some((value) => value !== ALL_VALUE);
  const critical = inventory.filter(
    (i) => i.status === "Critical" || i.status === "Out",
  ).length;
  const total = inventory.reduce((sum, i) => sum + i.units, 0);

  const handleDivisionChange = (value: string) => {
    setDivisionId(value);
    setDistrictId(ALL_VALUE);
    setUpazilaId(ALL_VALUE);
    setOrganizationId(ALL_VALUE);
  };

  const handleDistrictChange = (value: string) => {
    setDistrictId(value);
    setUpazilaId(ALL_VALUE);
    setOrganizationId(ALL_VALUE);
  };

  const handleUpazilaChange = (value: string) => {
    setUpazilaId(value);
    setOrganizationId(ALL_VALUE);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <DashboardHeader
          variant="clinical"
          title="Blood Inventory"
          subtitle="Active and available donors across all blood groups. Use the filters to narrow down the list."
          badge={filteredScope ? "Filtered Inventory" : "Platform Inventory"}
        />
        <div className="flex gap-4">
          <div className="px-3 py-2 rounded-3xl bg-white dark:bg-zinc-900 border border-border/40 shadow-premium flex items-center gap-4">
            <div className="size-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40">
                Critical Shortage
              </p>
              <p className="text-xl font-black tracking-tighter text-red-500">
                {critical} Groups
              </p>
            </div>
          </div>
          <div className="px-3 py-2 rounded-3xl bg-white dark:bg-zinc-900 border border-border/40 shadow-premium flex items-center gap-4">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Droplets className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40">
                Eligible Donors
              </p>
              <p className="text-xl font-black tracking-tighter">{total}</p>
            </div>
          </div>
          <Button
            onClick={() => setShowShortageModal(true)}
            className="h-15 px-6 rounded-3xl font-black text-xs uppercase  bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
          >
            <Activity className="size-4" />
            Platform Shortages
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Select value={divisionId} onValueChange={handleDivisionChange}>
          <SelectTrigger className="h-12 rounded-2xl border-border/40 font-bold text-xs uppercase ">
            <SelectValue placeholder="Division" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40">
            <SelectItem value={ALL_VALUE} className="font-bold">
              All Divisions
            </SelectItem>
            {divisions.map((division) => (
              <SelectItem
                key={division.id}
                value={division.id}
                className="font-bold"
              >
                {division.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={districtId} onValueChange={handleDistrictChange}>
          <SelectTrigger className="h-12 rounded-2xl border-border/40 font-bold text-xs uppercase ">
            <SelectValue placeholder="District" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40">
            <SelectItem value={ALL_VALUE} className="font-bold">
              All Districts
            </SelectItem>
            {districts.map((district) => (
              <SelectItem
                key={district.id}
                value={district.id}
                className="font-bold"
              >
                {district.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={upazilaId} onValueChange={handleUpazilaChange}>
          <SelectTrigger className="h-12 rounded-2xl border-border/40 font-bold text-xs uppercase ">
            <SelectValue placeholder="Upazila" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40">
            <SelectItem value={ALL_VALUE} className="font-bold">
              All Upazilas
            </SelectItem>
            {upazilas.map((upazila) => (
              <SelectItem
                key={upazila.id}
                value={upazila.id}
                className="font-bold"
              >
                {upazila.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={organizationId} onValueChange={setOrganizationId}>
          <SelectTrigger className="h-12 rounded-2xl border-border/40 font-bold text-xs uppercase ">
            <SelectValue placeholder="Organization" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40">
            <SelectItem value={ALL_VALUE} className="font-bold">
              All Organizations
            </SelectItem>
            {organizations.map((organization) => (
              <SelectItem
                key={organization.id}
                value={organization.id}
                className="font-bold"
              >
                {organization.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {loading && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 animate-pulse"
            />
          ))}
        </section>
      )}

      {!loading && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {inventory.map((item, i) => (
            <motion.div
              key={item.group}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card
                className={`rounded-[2.5rem] shadow-none border-border/40 overflow-hidden hover:shadow-premium transition-all duration-300 group relative ${item.status === "Critical" || item.status === "Out" ? "border-red-500/30" : ""}`}
              >
                <CardContent className="p-8 space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="size-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-xl tracking-tighter group-hover:bg-primary group-hover:text-white transition-all">
                      {item.group}
                    </div>
                    <Badge
                      className={`rounded-full px-3 py-1 text-[9px] font-black uppercase  border ${statusStyle(item.status)}`}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-4xl font-black tracking-tighter">
                      {item.units}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">
                      Eligible Donors
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border/40">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase shrink-0">
                      <Clock className="size-3" /> {item.updated}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>
      )}

      {!loading && critical > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-[2rem] bg-red-500/5 border border-red-500/20 flex items-center gap-4"
        >
          <div className="size-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
            <AlertCircle className="size-6" />
          </div>
          <div>
            <p className="text-sm font-black uppercase  text-red-500">
              {critical} Blood Group{critical > 1 ? "s" : ""} Need Attention In
              This Inventory View
            </p>
            <p className="text-[11px] font-medium text-red-500/60 mt-0.5">
              {inventory
                .filter((i) => i.status === "Critical" || i.status === "Out")
                .map((i) => i.group)
                .join(", ")}{" "}
              have low eligible donor availability for the selected scope.
            </p>
          </div>
        </motion.div>
      )}

      <OrganizationShortageModal
        open={showShortageModal}
        onOpenChange={setShowShortageModal}
      />
    </div>
  );
}
