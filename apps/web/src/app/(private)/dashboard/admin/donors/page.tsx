"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import {
  Search,
  Users,
  Droplets,
  ChevronLeft,
  ChevronRight,
  UserMinus,
  UserCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useGetAllDonorsQuery,
  useAdminUpdateDonorMutation,
} from "@/redux/features/donors/donorsApi";
import { ActionConfirmDialog } from "@/components/shared/ActionConfirmDialog/ActionConfirmDialog";
import Link from "next/link";
import { toast } from "sonner";

const PAGE_SIZE = 12;

export default function AdminDonorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [bloodFilter, setBloodFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [accountStatusFilter, setAccountStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusTarget, setStatusTarget] = useState<{
    id: string;
    status: "ACTIVE" | "SUSPENDED";
  } | null>(null);
  const [updating, setUpdating] = useState(false);

  const { data, isLoading } = useGetAllDonorsQuery({
    page: 1,
    limit: 500, // fetch all then filter client-side to keep existing pagination UX
  });

  const [adminUpdateDonor] = useAdminUpdateDonorMutation();

  const donors = data?.data ?? [];

  const filtered = useMemo(() => {
    return donors.filter((d) => {
      const q = searchQuery.toLowerCase();
      const donorBloodGroup = d.bloodGroup?.groupName ?? "";
      const matchSearch =
        !q ||
        d.fullName.toLowerCase().includes(q) ||
        (d.phone || "").includes(q) ||
        donorBloodGroup.toLowerCase().includes(q) ||
        (d.district?.name || "").toLowerCase().includes(q);
      const matchBlood =
        bloodFilter === "All" || donorBloodGroup === bloodFilter;
      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "available" &&
          d.availabilityStatus === "AVAILABLE") ||
        (statusFilter === "inactive" && d.availabilityStatus === "UNAVAILABLE");
      const matchAccount =
        accountStatusFilter === "All" ||
        d.accountStatus === accountStatusFilter;
      return matchSearch && matchBlood && matchStatus && matchAccount;
    });
  }, [donors, searchQuery, bloodFilter, statusFilter, accountStatusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, bloodFilter, statusFilter, accountStatusFilter]);

  const handleUpdateStatus = async () => {
    if (!statusTarget) return;
    setUpdating(true);
    try {
      await adminUpdateDonor({
        id: statusTarget.id,
        data: { accountStatus: statusTarget.status },
      }).unwrap();
      toast.success(
        `Donor account is now ${statusTarget.status.toLowerCase()}`,
      );
    } catch {
      toast.error("Failed to update donor status");
    } finally {
      setUpdating(false);
      setStatusTarget(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <DashboardHeader
          variant="clinical"
          title="Donor Registry"
          subtitle="Manage and verify every registered blood donor on the platform."
          badge="Global Authority"
        />
      </div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          {
            label: "Total Donors",
            val: donors.length,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Available",
            val: donors.filter((d) => d.availabilityStatus === "AVAILABLE")
              .length,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Showing",
            val: filtered.length,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Suspended",
            val: donors.filter((d) => d.accountStatus === "SUSPENDED").length,
            color: "text-red-500",
            bg: "bg-red-500/10",
          },
        ].map((s) => (
          <Card
            key={s.label}
            className="rounded-[2rem] border-border/40 shadow-none"
          >
            <CardContent className="p-5 flex items-center gap-3">
              <div
                className={`size-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center`}
              >
                <Users className="size-4" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase  text-muted-foreground opacity-60">
                  {s.label}
                </p>
                <p className="text-xl font-black tracking-tighter">{s.val}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-40" />
          <Input
            placeholder="Search by name, phone, blood group, district..."
            className="h-12 pl-11 rounded-2xl border-border/40 bg-zinc-50/50 dark:bg-zinc-900/50 font-bold text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={bloodFilter} onValueChange={setBloodFilter}>
          <SelectTrigger className="h-12 w-full sm:w-[160px] rounded-2xl border-border/40 font-bold text-xs uppercase ">
            <SelectValue placeholder="Blood Group" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40">
            {["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
              (g) => (
                <SelectItem key={g} value={g} className="font-bold">
                  {g === "All" ? "All Groups" : g}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-12 w-full sm:w-[160px] rounded-2xl border-border/40 font-bold text-xs uppercase ">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40">
            <SelectItem value="All" className="font-bold">
              All (Status)
            </SelectItem>
            <SelectItem value="available" className="font-bold">
              Available
            </SelectItem>
            <SelectItem value="inactive" className="font-bold">
              Unavailable
            </SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={accountStatusFilter}
          onValueChange={setAccountStatusFilter}
        >
          <SelectTrigger className="h-12 w-full sm:w-[160px] rounded-2xl border-border/40 font-bold text-xs uppercase ">
            <SelectValue placeholder="Account" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40">
            <SelectItem value="All" className="font-bold">
              All (Account)
            </SelectItem>
            <SelectItem value="ACTIVE" className="font-bold">
              Active Only
            </SelectItem>
            <SelectItem value="SUSPENDED" className="font-bold">
              Suspended
            </SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && paginated.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="size-20 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6">
            <Users className="size-10" />
          </div>
          <p className="text-xl font-black uppercase tracking-tighter">
            No Donors Found
          </p>
          <p className="text-sm text-muted-foreground mt-2 opacity-60">
            Try adjusting your filters.
          </p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && paginated.length > 0 && (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginated.map((donor, i) => (
            <motion.div
              key={donor.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="group rounded-[2.5rem] shadow-none border-border/40 overflow-hidden hover:shadow-premium transition-all duration-300 h-full">
                <CardContent className="p-6 space-y-4 flex flex-col h-full">
                  <div className="flex items-start justify-between">
                    <div className="size-14 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-xl group-hover:bg-primary group-hover:text-white transition-all">
                      {donor.fullName[0]}
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-red-500/5 border border-red-500/10 group-hover:bg-red-500 group-hover:text-white transition-all min-w-[52px]">
                      <Droplets className="size-3 mb-0.5" />
                      <span className="text-lg font-black leading-none">
                        {donor.bloodGroup?.groupName ?? "—"}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <Link
                      href={`/donor/${donor.id}`}
                      className="font-black text-lg tracking-tight uppercase hover:text-primary transition-colors block w-fit"
                    >
                      {donor.fullName}
                    </Link>
                    <p className="text-[10px] font-black text-muted-foreground uppercase  opacity-40">
                      {donor.district?.name ?? "—"}, BD
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground mt-1 opacity-40">
                      {donor.phone ?? donor.email}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border/40">
                    <div className="flex gap-1">
                      <Badge
                        className={`rounded-full px-3 py-1 text-[8px] font-black uppercase  ${donor.availabilityStatus === "AVAILABLE"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-zinc-500/10 text-zinc-500"
                          }`}
                      >
                        {donor.availabilityStatus === "AVAILABLE"
                          ? "Available"
                          : "Unavailable"}
                      </Badge>
                      <Badge
                        className={`rounded-full px-3 py-1 text-[8px] font-black uppercase  ${donor.accountStatus === "ACTIVE"
                            ? "bg-blue-500/5 text-blue-500"
                            : "bg-red-500/5 text-red-500"
                          }`}
                      >
                        {donor.accountStatus}
                      </Badge>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {donor.accountStatus === "ACTIVE" ? (
                        <Button
                          size="icon"
                          variant="outline"
                          className="size-8 rounded-xl border-red-500/10 text-red-500 hover:bg-red-500/10"
                          onClick={() =>
                            setStatusTarget({
                              id: donor.id,
                              status: "SUSPENDED",
                            })
                          }
                        >
                          <UserMinus className="size-3.5" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="outline"
                          className="size-8 rounded-xl border-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10"
                          onClick={() =>
                            setStatusTarget({ id: donor.id, status: "ACTIVE" })
                          }
                        >
                          <UserCheck className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black uppercase  text-muted-foreground opacity-60">
            Page {currentPage} of {totalPages} · {filtered.length} donors
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase "
            >
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase "
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <ActionConfirmDialog
        open={!!statusTarget}
        onOpenChange={(o) => !o && setStatusTarget(null)}
        title={
          statusTarget?.status === "SUSPENDED"
            ? "Suspend Account"
            : "Activate Account"
        }
        description={
          statusTarget?.status === "SUSPENDED"
            ? "Are you sure you want to suspend this donor account? They will not be able to accept requests."
            : "Are you sure you want to activate this donor account? They will be visible in the registry."
        }
        onConfirm={handleUpdateStatus}
        loading={updating}
        actionText={
          statusTarget?.status === "SUSPENDED" ? "Suspend" : "Activate"
        }
        variant={statusTarget?.status === "SUSPENDED" ? "danger" : "success"}
      />
    </div>
  );
}
