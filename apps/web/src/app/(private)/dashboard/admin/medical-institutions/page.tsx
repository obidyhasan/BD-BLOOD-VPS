"use client";

import { useState, useMemo } from "react";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Edit3,
  Hospital,
  MapPin,
  Phone,
  Clock,
  Stethoscope
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useGetAllInstitutionsQuery,
  useDeleteInstitutionMutation,
} from "@/redux/features/medicalInstitutions/medicalInstitutionsApi";
import { mapInstitutionToUI, type InstitutionUI } from "@/lib/medical";
import { toast } from "sonner";
import UploadInstitutionModal from "@/components/modules/Admin/Medical/UploadInstitutionModal";
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

export default function AdminMedicalInstitutionsPage() {
  const { data, isLoading: loading } = useGetAllInstitutionsQuery({ limit: 200 });
  const [deleteInstitution] = useDeleteInstitutionMutation();
  const institutions: InstitutionUI[] = useMemo(
    () => (data?.data ?? []).map(mapInstitutionToUI),
    [data],
  );
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDivision, setFilterDivision] = useState("all");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredInstitutions = useMemo(() => {
    return institutions.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDivision = filterDivision === "all" || i.division === filterDivision;
      const matchesDistrict = filterDistrict === "all" || i.district === filterDistrict;
      return matchesSearch && matchesDivision && matchesDistrict;
    });
  }, [institutions, searchQuery, filterDivision, filterDistrict]);

  const totalPages = Math.ceil(filteredInstitutions.length / itemsPerPage);
  const paginatedItems = filteredInstitutions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInstitution(deleteTarget).unwrap();
      toast.success("Institution removed");
    } catch {
      toast.error("Failed to delete institution");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-2">
        <DashboardHeader
          variant="clinical"
          title="Medical Institutions"
          subtitle="Manage verified hospitals, clinics, and medical institutions."
          badge="Infrastructure Hub"
        />
        <div className="flex gap-4">
          <UploadInstitutionModal onSuccess={() => setCurrentPage(1)} />
        </div>
      </div>

      {/* Search & Location Filters */}
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or type..."
            className="h-14 pl-12 rounded-2xl shadow-none bg-white dark:bg-zinc-900 border border-border/40 font-bold"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select value={filterDivision} onValueChange={setFilterDivision}>
            <SelectTrigger className="h-14 min-w-[180px] rounded-2xl shadow-none bg-white dark:bg-zinc-900 border border-border/40 font-black text-[10px] uppercase px-6">
              <SelectValue placeholder="Division" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="font-bold">All Divisions</SelectItem>
              {Divisions.map(d => <SelectItem key={d.name} value={d.name} className="font-bold">{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterDistrict} onValueChange={setFilterDistrict}>
            <SelectTrigger className="h-14 min-w-[180px] rounded-2xl shadow-none bg-white dark:bg-zinc-900 border border-border/40 font-black text-[10px] uppercase px-6">
              <SelectValue placeholder="District" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="font-bold">All Districts</SelectItem>
              {khulnaDistricts.map(d => <SelectItem key={d.name} value={d.name} className="font-bold">{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Institutions Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 animate-pulse border border-border/40" />
        ))}

        {!loading && paginatedItems.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-40">
            <Hospital className="size-16 mx-auto mb-4 stroke-1" />
            <p className="text-xl font-black uppercase tracking-tighter">No Institutions Found</p>
          </div>
        )}

        {!loading && paginatedItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="group relative border border-border/40 rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-900 hover:shadow-premium transition-all duration-500 flex flex-col"
          >
            {/* Visual Section */}
            <div className="relative aspect-video overflow-hidden bg-zinc-50 border-b border-border/40">
              <Image
                src={item.image || "https://i.ibb.co.com/99D66Z4b/Obidy-Hasan.png"}
                alt={item.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <Link href={`/medical/${item.slug}`}>
                  <Button size="icon" className="size-10 rounded-xl bg-white text-zinc-950 hover:bg-primary hover:text-white transition-all shadow-xl">
                    <Eye className="size-4" />
                  </Button>
                </Link>
                <UploadInstitutionModal
                  institution={item}
                  trigger={
                    <Button size="icon" className="size-10 rounded-xl bg-white text-zinc-950 hover:bg-zinc-900 hover:text-white transition-all shadow-xl">
                      <Edit3 className="size-4" />
                    </Button>
                  }
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="size-10 rounded-xl bg-red-500 hover:bg-red-600 shadow-xl transition-all"
                  onClick={() => setDeleteTarget(item.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <Badge variant="secondary" className="absolute top-4 left-4 px-3 py-1 rounded-lg font-black text-[9px] uppercase  border-none">
                {item.type}
              </Badge>
            </div>

            {/* Info Section */}
            <div className="p-6 space-y-4 flex flex-col flex-1">
              <div className="space-y-1">
                <h3 className="font-black text-lg uppercase tracking-tighter truncate leading-tight group-hover:text-primary transition-colors">
                  {item.name}
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 flex items-center gap-1">
                  <MapPin className="size-3" /> {item.upazila}, {item.district}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/10 border-dashed">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground/60">
                  <Phone className="size-3 text-primary/40" />
                  {item.phone.slice(0, 10)}...
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground/60">
                  <Clock className="size-3 text-primary/40" />
                  {item.status}
                </div>
                <div className="flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground/60 col-span-2">
                  <Stethoscope className="size-3 text-primary/40" />
                  {item.doctorsCount} Specialized Doctors
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 pt-4">
        <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">
          Page {currentPage} of {totalPages} · {filteredInstitutions.length} institutions
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
              <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">De-Register Facility</AlertDialogTitle>
              <AlertDialogDescription className="text-sm font-medium text-muted-foreground/60 leading-relaxed">
                Are you sure you want to remove this institution from the directory? This action will purge all associated metadata.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-4 mt-8">
            <AlertDialogCancel asChild>
              <Button variant="outline" className="h-12 rounded-2xl font-black text-[10px] uppercase  border-border/40">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={confirmDelete} className="h-12 rounded-2xl font-black text-[10px] uppercase  bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/20 transition-all">Delete</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
