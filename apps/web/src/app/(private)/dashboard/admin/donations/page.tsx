"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Droplets,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  Activity,
  Search,
  Building2,
  TrendingUp,
  Calendar,
  ExternalLink,
  ChevronRight,
  FileText,
  ChevronLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { bloodGroup } from "@/constant/BloodGroup";
import {
  useGetAllDonationsQuery,
  useRejectDonationMutation,
  useReverseDonationMutation,
  useVerifyDonationMutation,
  type BloodDonation,
} from "@/redux/features/bloodDonations/bloodDonationsApi";
import { format } from "date-fns";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/apiError";

function DonationCard({
  donation,
  i,
  onVerify,
  onReject,
  onReverse,
}: {
  donation: BloodDonation;
  i: number;
  onVerify: (id: string) => void;
  onReject: (id: string) => void;
  onReverse: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
    >
      <Dialog>
        <DialogTrigger asChild>
          <Card className="rounded-[2.5rem] shadow-none border-border/40 overflow-hidden hover:border-primary/20 hover:shadow-premium transition-all duration-300 group bg-white dark:bg-zinc-950 cursor-pointer">
            <CardContent className="p-7">
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                <div className="size-16 rounded-3xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center font-black group-hover:bg-primary/5 transition-colors shrink-0">
                  <Droplets className="size-8 text-primary" />
                </div>

                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 group/donor">
                      <Link
                        href={`/donor/${donation.donorId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xl font-black uppercase tracking-tight hover:text-primary transition-colors flex items-center gap-2"
                      >
                        {donation.donor.fullName}
                        <Badge className="rounded-full px-4 py-1 text-[9px] font-black uppercase bg-red-500/10 text-red-500 border-none">
                          {donation.donor.bloodGroup.groupName}
                        </Badge>
                        <ExternalLink className="size-4 opacity-0 group-hover/donor:opacity-100 transition-all" />
                      </Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-muted-foreground mt-2">
                      <p className="text-[10px] font-bold uppercase flex items-center gap-2">
                        <MapPin className="size-3.5 text-primary" />
                        {donation.hospitalName}
                      </p>
                      <p className="text-[10px] font-bold uppercase flex items-center gap-2">
                        <Clock className="size-3.5" />
                        {format(new Date(donation.donationDate), "MMM dd, yyyy")}
                      </p>
                      {donation.organization && (
                        <span className="text-[10px] font-bold uppercase flex items-center gap-2 text-primary">
                          <Building2 className="size-3.5" />
                          {donation.organization.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <FileText className="size-3.5 text-emerald-600" />
                    </div>
                    <p className="text-[10px] font-black uppercase  text-muted-foreground">
                      Status:{" "}
                      <span
                        className={
                          donation.verificationStatus === "VERIFIED"
                            ? "text-emerald-500"
                            : donation.verificationStatus === "REJECTED"
                              ? "text-red-500"
                              : "text-amber-500"
                        }
                      >
                        {donation.verificationStatus}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="lg:text-right border-t lg:border-t-0 lg:border-l border-border/40 pt-6 lg:pt-0 lg:pl-10 space-y-1 min-w-[120px]">
                  <p className="text-3xl font-black leading-none tracking-tighter">
                    1 <span className="text-sm uppercase opacity-40">Unit</span>
                  </p>
                  <p className="text-[10px] font-black text-emerald-500 uppercase ">
                    Impacted 3 Lives
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogTrigger>

        <DialogContent className="rounded-[3rem] border-border/40 p-8 max-w-xl shadow-2xl bg-white dark:bg-zinc-950">
          <DialogHeader className="gap-2">
            <div className="flex items-center gap-4 mb-4">
              <div className="size-12 rounded-[2rem] bg-red-500/10 text-red-500 flex items-center justify-center">
                <Droplets className="size-8" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                  Donation Details
                </DialogTitle>
                <DialogDescription className="text-xs font-bold opacity-40">
                  ID: {donation.id.slice(0, 8).toUpperCase()}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase ">
                  Donor
                </p>
                <p className="text-lg font-black">{donation.donor.fullName}</p>
                <p className="text-xs font-bold opacity-60">{donation.donor.email}</p>
              </div>
              <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900 space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase ">
                  Blood Group
                </p>
                <p className="text-lg font-black text-red-500">
                  {donation.donor.bloodGroup.groupName}
                </p>
                <p className="text-xs font-bold opacity-60">1 Bag</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0">
                  <MapPin className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase  text-muted-foreground">
                    Hospital
                  </p>
                  <p className="text-sm font-bold">{donation.hospitalName}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="size-10 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0">
                  <Calendar className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase  text-muted-foreground">
                    Donation Date
                  </p>
                  <p className="text-sm font-bold">
                    {format(new Date(donation.donationDate), "MMMM dd, yyyy")}
                  </p>
                </div>
              </div>

              {donation.notes && (
                <div className="flex items-start gap-4">
                  <div className="size-10 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0">
                    <FileText className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase  text-muted-foreground">
                      Notes
                    </p>
                    <p className="text-sm font-bold leading-relaxed opacity-80">
                      &quot;{donation.notes}&quot;
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border/20 pt-6">
              {donation.verificationStatus === "PENDING" && (
                <>
                  <Button className="rounded-xl font-black" onClick={() => onVerify(donation.id)}>
                    Verify Donation
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl font-black text-red-600"
                    onClick={() => onReject(donation.id)}
                  >
                    Reject Evidence
                  </Button>
                </>
              )}
              {donation.verificationStatus === "VERIFIED" && (
                <Button
                  variant="outline"
                  className="rounded-xl font-black text-red-600"
                  onClick={() => onReverse(donation.id)}
                >
                  Reverse Verification
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Badge
                className={`border-none font-black text-[10px] uppercase px-4 py-1.5 rounded-full ${donation.verificationStatus === "VERIFIED"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : donation.verificationStatus === "REJECTED"
                    ? "bg-red-500/10 text-red-500"
                    : "bg-amber-500/10 text-amber-500"
                  }`}
              >
                <CheckCircle2 className="size-3 mr-2 inline" />
                {donation.verificationStatus}
              </Badge>
              <Link
                href={`/dashboard/admin/donations`}
                className="text-[10px] font-black uppercase  text-primary hover:underline underline-offset-4 flex items-center gap-1"
              >
                View All <ChevronRight className="size-3" />
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export default function AdminDonationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [bgFilter, setBgFilter] = useState("All");
  const [orgFilter, setOrgFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { data, isLoading } = useGetAllDonationsQuery({ limit: 500 });
  const [verifyDonation] = useVerifyDonationMutation();
  const [rejectDonation] = useRejectDonationMutation();
  const [reverseDonation] = useReverseDonationMutation();
  const donations = useMemo(() => data?.data ?? [], [data?.data]);

  const handleVerify = async (id: string) => {
    try {
      await verifyDonation({ id }).unwrap();
      toast.success("Donation verified and donor/request projections updated.");
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "Failed to verify donation"));
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Why is this donation evidence being rejected?")?.trim();
    if (!reason || reason.length < 3) return;
    try {
      await rejectDonation({ id, reason }).unwrap();
      toast.info("Donation evidence rejected for donor correction.");
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "Failed to reject donation"));
    }
  };

  const handleReverse = async (id: string) => {
    const reason = window.prompt("Reason for reversing this verified donation?")?.trim();
    if (!reason || reason.length < 3) return;
    try {
      await reverseDonation({ id, reason }).unwrap();
      toast.warning("Verification reversed and dependent projections recalculated.");
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "Failed to reverse donation"));
    }
  };

  const organizations = useMemo(() => {
    const orgs = new Set(donations.map((d) => d.organization?.name).filter(Boolean));
    return Array.from(orgs) as string[];
  }, [donations]);

  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      const matchesSearch =
        d.donor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.hospitalName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBg =
        bgFilter === "All" || d.donor.bloodGroup.groupName === bgFilter;
      const matchesOrg =
        orgFilter === "All" || d.organization?.name === orgFilter;
      return matchesSearch && matchesBg && matchesOrg;
    });
  }, [donations, searchQuery, bgFilter, orgFilter]);

  const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);
  const paginatedDonations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDonations.slice(start, start + itemsPerPage);
  }, [filteredDonations, currentPage]);

  const stats = useMemo(() => [
    {
      label: "Total Donations",
      val: donations.length,
      icon: Droplets,
      color: "text-red-500",
      bg: "bg-red-500/10",
      sub: "All time records",
    },
    {
      label: "Unique Donors",
      val: new Set(donations.map((d) => d.donorId)).size,
      icon: User,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      sub: "Verified active contributors",
    },
    {
      label: "Lives Impacted",
      val: donations.length * 3,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      sub: "Approximate clinical value",
    },
    {
      label: "Partner Orgs",
      val: organizations.length,
      icon: Building2,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      sub: "Operational partners",
    },
  ], [donations, organizations]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-2">
        <DashboardHeader
          variant="clinical"
          title="Donation Records"
          subtitle="Track every verified blood donation across the network."
          badge="Admin Oversight"
        />
      </div>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="rounded-[2.5rem] border-border/40 overflow-hidden shadow-none hover:shadow-premium transition-all duration-300 bg-white dark:bg-zinc-950 group h-full">
              <CardContent className="p-8 space-y-4">
                <div
                  className={`size-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <stat.icon className="size-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground  opacity-60">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-black text-foreground tracking-tighter">
                    {stat.val}
                  </p>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground opacity-40">
                  {stat.sub}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-4"
      >
        <div className="relative flex-1 min-w-full sm:min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search donor name, hospital..."
            className="h-14 pl-12 rounded-2xl shadow-none bg-white dark:bg-zinc-900/50 border border-border/40 font-bold"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={bgFilter}
            onValueChange={(v) => {
              setBgFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="py-7 rounded-2xl shadow-none bg-white dark:bg-zinc-900/50 border border-border/40 font-black text-[10px] uppercase px-5">
              <SelectValue placeholder="Blood Group" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40">
              <SelectItem value="All" className="font-bold">
                All Groups
              </SelectItem>
              {bloodGroup.map((bg) => (
                <SelectItem key={bg} value={bg} className="font-bold">
                  {bg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={orgFilter}
            onValueChange={(v) => {
              setOrgFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="py-7 rounded-2xl shadow-none bg-white dark:bg-zinc-900/50 border border-border/40 font-black text-[10px] uppercase px-5">
              <SelectValue placeholder="Organization" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40">
              <SelectItem value="All" className="font-bold">
                All Organizations
              </SelectItem>
              {organizations.map((org) => (
                <SelectItem key={org} value={org} className="font-bold">
                  {org}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-900 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && paginatedDonations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-20 rounded-3xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-6">
            <Activity className="size-10 text-muted-foreground opacity-20" />
          </div>
          <p className="text-xl font-black uppercase ">
            No Donation Records Found
          </p>
          <p className="text-sm text-muted-foreground mt-2 opacity-60">
            Try adjusting your filters or search query.
          </p>
        </div>
      )}

      {/* Donations List */}
      {!isLoading && (
        <div className="space-y-4">
          {paginatedDonations.map((d, i) => (
            <DonationCard
              key={d.id}
              donation={d}
              i={i}
              onVerify={handleVerify}
              onReject={handleReject}
              onReverse={handleReverse}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">
            Page {currentPage} of {totalPages} · {filteredDonations.length} records
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase hover:bg-zinc-950 hover:text-white transition-all"
            >
              <ChevronLeft className="size-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase hover:bg-zinc-950 hover:text-white transition-all"
            >
              Next
              <ChevronRight className="size-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}