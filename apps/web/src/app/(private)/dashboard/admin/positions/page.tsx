"use client";

import { useState, useMemo } from "react";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Edit3,
  Briefcase,
  Users2,
  Activity,
} from "lucide-react";
import {
  useGetAllPositionsQuery,
  useDeletePositionMutation,
} from "@/redux/features/organizations/organizationsApi";
import { mapOrganizationPositionToUI, type SystemPositionUI } from "@/lib/position";
import { toast } from "sonner";
import UploadPositionModal from "@/components/modules/Admin/Positions/UploadPositionModal";
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
import { cn } from "@/lib/utils";

const getLevelStyles = (level: string) => {
  if (level === "Executive") return "text-primary bg-primary/10 border-primary/20 shadow-primary/5";
  if (level === "Management") return "text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5";
  return "text-zinc-500 bg-zinc-500/10 border-zinc-500/20 shadow-zinc-500/5";
};

export default function AdminPositionsPage() {
  const { data: positionsData, isLoading: loading } = useGetAllPositionsQuery();
  const [deletePosition] = useDeletePositionMutation();
  const positions: SystemPositionUI[] = useMemo(
    () => (positionsData?.data ?? []).map(mapOrganizationPositionToUI),
    [positionsData],
  );
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredPositions = useMemo(() => {
    return positions.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = filterLevel === "all" || p.level === filterLevel;
      return matchesSearch && matchesLevel;
    });
  }, [positions, searchQuery, filterLevel]);

  const totalPages = Math.ceil(filteredPositions.length / itemsPerPage);
  const paginatedItems = filteredPositions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePosition(deleteTarget).unwrap();
      toast.success("Position deleted");
    } catch {
      toast.error("Failed to delete position");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-2">
        <DashboardHeader
          variant="clinical"
          title="Positions"
          subtitle="Manage leadership positions within the organization."
          badge="Roles & Levels"
        />
        <div className="flex gap-4">
          <UploadPositionModal onSuccess={() => setCurrentPage(1)} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search positions by title..."
            className="h-14 pl-12 rounded-2xl shadow-none bg-white dark:bg-zinc-900 border border-border/40 font-bold"
          />
        </div>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="py-7 min-w-[200px] rounded-2xl shadow-none bg-white dark:bg-zinc-900 border border-border/40 font-black text-[10px] uppercase px-6">
            <SelectValue placeholder="Tier / Level" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="font-bold">All Levels</SelectItem>
            <SelectItem value="Executive" className="font-bold">Executive Tier</SelectItem>
            <SelectItem value="Management" className="font-bold">Management</SelectItem>
            <SelectItem value="Support" className="font-bold">Support Staff</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Positions Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 animate-pulse border border-border/40" />
        ))}

        {!loading && paginatedItems.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-40">
            <Briefcase className="size-16 mx-auto mb-4 stroke-1" />
            <p className="text-xl font-black uppercase tracking-tighter">No Roles Established</p>
          </div>
        )}

        {!loading && paginatedItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="group relative border border-border/40 rounded-[2.5rem] overflow-hidden bg-white dark:bg-zinc-900 hover:shadow-premium transition-all duration-500 flex flex-col h-full border-dashed"
          >
            <div className="p-8 space-y-6 flex flex-col flex-1 relative z-10">
              <div className="flex items-start justify-between">
                <div className={cn("size-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 border border-current/10 shadow-lg", getLevelStyles(item.level))}>
                  <Briefcase className="size-7" />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={cn("rounded-lg px-3 py-1 text-[9px] font-black uppercase  border shadow-sm", getLevelStyles(item.level))}>
                    {item.level}
                  </Badge>
                  <p className="text-[10px] font-black uppercase text-muted-foreground/60">{item.status}</p>
                </div>
              </div>

              <div className="space-y-1 flex-1">
                <h3 className="text-xl font-black text-foreground tracking-tighter uppercase leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {item.name}
                </h3>
                <div className="flex items-center gap-2">
                  <Users2 className="size-3 text-primary opacity-40" />
                  <p className="text-xs font-black uppercase text-muted-foreground/80 tracking-tighter">
                    {item.members} <span className="opacity-40">Authorized Members</span>
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-border/10 border-dashed flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-muted-foreground/40">
                  <Activity className="size-3 text-primary/40" />
                  Active Protocol
                </div>
                <div className="flex gap-2">
                  <UploadPositionModal
                    position={item}
                    trigger={
                      <Button size="icon" variant="ghost" className="size-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <Edit3 className="size-4 text-muted-foreground" />
                      </Button>
                    }
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-9 rounded-xl hover:bg-red-500/10 hover:text-red-500"
                    onClick={() => setDeleteTarget(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 pt-4">
        <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">
          Page {currentPage} of {totalPages} · {filteredPositions.length} roles
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
              <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">Abolish Position</AlertDialogTitle>
              <AlertDialogDescription className="text-sm font-medium text-muted-foreground/60 leading-relaxed">
                Are you sure you want to abolish this official leadership role? This will immediately remove it from the organization hierarchy.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-4 mt-8">
            <AlertDialogCancel asChild>
              <Button variant="outline" className="h-12 rounded-2xl font-black text-[10px] uppercase  border-border/40">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={confirmDelete} className="h-12 rounded-2xl font-black text-[10px] uppercase  bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/20 transition-all">Abolish Role</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
