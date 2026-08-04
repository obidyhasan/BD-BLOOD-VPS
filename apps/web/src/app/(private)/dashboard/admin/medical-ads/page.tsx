"use client";

import { useState, useMemo } from "react";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Eye,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Edit3,
  Megaphone,
  MapPin,
  Pause,
  Play,
  ExternalLink,
  Hospital
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useGetAdminAdsQuery,
  useDeleteAdMutation,
  useUpdateAdStatusMutation,
} from "@/redux/features/medicalInstitutions/medicalInstitutionsApi";
import { mapAdToUI, type AdUI } from "@/lib/medical";
import { toast } from "sonner";
import UploadAdModal from "@/components/modules/Admin/Medical/UploadAdModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Divisions, khulnaDistricts } from "@/components/shared/LocationSelector/LocationSelector";
import { cn } from "@/lib/utils";

export default function AdminMedicalAdsPage() {
  const { data, isLoading: loading } = useGetAdminAdsQuery();
  const [deleteAd] = useDeleteAdMutation();
  const [updateAdStatus] = useUpdateAdStatusMutation();
  const ads: AdUI[] = useMemo(() => (data?.data ?? []).map(mapAdToUI), [data]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<AdUI | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDivision, setFilterDivision] = useState("all");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredAds = useMemo(() => {
    return ads.filter(a => {
      const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.medicalName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDivision = filterDivision === "all" || a.division === filterDivision;
      const matchesDistrict = filterDistrict === "all" || a.district === filterDistrict;
      return matchesSearch && matchesDivision && matchesDistrict;
    });
  }, [ads, searchQuery, filterDivision, filterDistrict]);

  const totalPages = Math.ceil(filteredAds.length / itemsPerPage);
  const paginatedItems = filteredAds.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAd(deleteTarget).unwrap();
      toast.success("Ad campaign stopped");
    } catch {
      toast.error("Failed to delete ad");
    } finally {
      setDeleteTarget(null);
    }
  };

  const confirmStatusToggle = async () => {
    if (!statusTarget) return;
    try {
      const newStatus = statusTarget.status === "Active" ? "INACTIVE" : "ACTIVE";
      await updateAdStatus({ id: statusTarget.id, status: newStatus }).unwrap();
      toast.success(`Campaign ${newStatus === "ACTIVE" ? "active" : "paused"}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusTarget(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-2">
        <DashboardHeader
          variant="clinical"
          title="Promotional Ads"
          subtitle="Manage banner ads and healthcare promotions for verified medical partners."
          badge="Marketing Hub"
        />
        <div className="flex gap-4">
          <UploadAdModal onSuccess={() => setCurrentPage(1)} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ads by title or medical name..."
            className="h-14 pl-12 rounded-2xl shadow-none bg-white dark:bg-zinc-900 border border-border/40 font-bold"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select value={filterDivision} onValueChange={setFilterDivision}>
            <SelectTrigger className="py-7 min-w-[180px] rounded-2xl shadow-none bg-white dark:bg-zinc-900 border border-border/40 font-black text-[10px] uppercase px-6">
              <SelectValue placeholder="Division" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="font-bold">All Divisions</SelectItem>
              {Divisions.map(d => <SelectItem key={d.name} value={d.name} className="font-bold">{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterDistrict} onValueChange={setFilterDistrict}>
            <SelectTrigger className="py-7 min-w-[180px] rounded-2xl shadow-none bg-white dark:bg-zinc-900 border border-border/40 font-black text-[10px] uppercase px-6">
              <SelectValue placeholder="District" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="font-bold">All Districts</SelectItem>
              {khulnaDistricts.map(d => <SelectItem key={d.name} value={d.name} className="font-bold">{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ads Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-80 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 animate-pulse border border-border/40" />
        ))}

        {!loading && paginatedItems.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-40">
            <Megaphone className="size-16 mx-auto mb-4 stroke-1" />
            <p className="text-xl font-black uppercase tracking-tighter">No Active Campaigns</p>
          </div>
        )}

        {!loading && paginatedItems.map((ad, i) => (
          <motion.div
            key={ad.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="group relative border border-border/40 rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900 hover:shadow-premium transition-all duration-500 flex flex-col"
          >
            {/* Ad Banner View */}
            <div className="relative aspect-[21/9] overflow-hidden bg-zinc-50 border-b border-border/40">
              <Image
                src={ad.bannerImage || "https://i.ibb.co.com/99D66Z4b/Obidy-Hasan.png"}
                alt={ad.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <Link href={`/medical/${ad.medicalSlug}`}>
                  <Button size="icon" className="size-10 rounded-xl bg-white text-zinc-950 hover:bg-primary hover:text-white transition-all">
                    <ExternalLink className="size-4" />
                  </Button>
                </Link>
                <UploadAdModal
                  ad={ad}
                  trigger={
                    <Button size="icon" className="size-10 rounded-xl bg-white text-zinc-950 hover:bg-zinc-900 hover:text-white transition-all">
                      <Edit3 className="size-4" />
                    </Button>
                  }
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="size-10 rounded-xl bg-red-500 hover:bg-red-600 transition-all"
                  onClick={() => setDeleteTarget(ad.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <Badge
                variant={ad.status === "Active" ? "primary" : "secondary"}
                className="absolute top-4 left-4 px-3 py-1 rounded-lg font-black text-[9px] uppercase  border-none"
              >
                {ad.status}
              </Badge>
            </div>

            {/* Ad Details */}
            <div className="p-6 space-y-4 flex flex-col flex-1">
              <div className="space-y-1">
                <h3 className="font-black text-xl uppercase tracking-tighter truncate leading-tight group-hover:text-primary transition-colors">
                  {ad.title}
                </h3>
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase opacity-60">
                  <Hospital className="size-3 text-primary" />
                  {ad.medicalName}
                </div>
              </div>

              <p className="text-sm font-medium text-muted-foreground/80 line-clamp-2 leading-relaxed">
                {ad.description}
              </p>

              <div className=" flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-muted-foreground/60">
                  <MapPin className="size-3 text-primary/40" />
                  {ad.upazila}, {ad.district}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusTarget(ad)}
                  className="h-8 px-3 rounded-lg font-black text-[9px] uppercase  transition-all"
                >
                  {ad.status === "Active" ? (
                    <><Pause className="size-3 mr-1.5" /> Pause</>
                  ) : (
                    <><Play className="size-3 mr-1.5" /> Resume</>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 pt-4">
        <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">
          Page {currentPage} of {totalPages} · {filteredAds.length} campaigns
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase hover:bg-zinc-950 hover:text-white transition-all"
          >
            <ChevronLeft className="size-4 mr-2" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase hover:bg-zinc-950 hover:text-white transition-all"
          >
            Next
            <ChevronRight className="size-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-border/40 p-8 max-w-md">
          <AlertDialogHeader className="space-y-4">
            <div className="size-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <AlertCircle className="size-7" />
            </div>
            <div>
              <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">Terminate Campaign</AlertDialogTitle>
              <AlertDialogDescription className="text-sm font-medium text-muted-foreground/60 leading-relaxed">
                Are you sure you want to delete this advertisement? This action will immediately remove the promotion from all public banners.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-4 mt-8">
            <AlertDialogCancel asChild>
              <Button variant="outline" className="h-12 rounded-2xl font-black text-[10px] uppercase  border-border/40">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={confirmDelete} className="h-12 rounded-2xl font-black text-[10px] uppercase  bg-red-500 hover:bg-red-600 text-white transition-all">Terminate</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Confirmation */}
      <AlertDialog open={!!statusTarget} onOpenChange={(open) => !open && setStatusTarget(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-border/40 p-8 max-w-md">
          <AlertDialogHeader className="space-y-4">
            <div className={cn(
              "size-14 rounded-2xl flex items-center justify-center",
              statusTarget?.status === "Active" ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
            )}>
              {statusTarget?.status === "Active" ? <Pause className="size-7" /> : <Play className="size-7" />}
            </div>
            <div>
              <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">
                {statusTarget?.status === "Active" ? "Pause Campaign" : "Resume Campaign"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm font-medium text-muted-foreground/60 leading-relaxed">
                {statusTarget?.status === "Active"
                  ? "Are you sure you want to pause this advertisement? It will be hidden from the public carousel."
                  : "Are you sure you want to resume this advertisement? It will be immediately visible on the public carousel."}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-4 mt-8">
            <AlertDialogCancel asChild>
              <Button variant="outline" className="h-12 rounded-2xl font-black text-[10px] uppercase  border-border/40">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                onClick={confirmStatusToggle}
                className={cn(
                  "h-12 rounded-2xl font-black text-[10px] uppercase  text-white transition-all",
                  statusTarget?.status === "Active" ? "bg-amber-500 hover:bg-amber-600 shadow-xl shadow-amber-500/20" : "bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20"
                )}
              >
                {statusTarget?.status === "Active" ? "Pause" : "Resume"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
