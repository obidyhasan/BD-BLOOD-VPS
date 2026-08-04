"use client";

import React, { useState, useMemo } from "react";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Edit3,
  BookOpen,
  Scale,
  ShieldAlert,
  Lock,
  Users,
  Eye,
  Clock,
} from "lucide-react";
import {
  useGetAllPoliciesQuery,
  useDeletePolicyMutation,
  useUpdatePolicyMutation,
  type Policy,
} from "@/redux/features/policies/policiesApi";
import { toast } from "sonner";
import UploadPolicyModal from "@/components/modules/Admin/Policies/UploadPolicyModal";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const categoryIcons: Record<string, React.ElementType> = {
  SAFETY: ShieldAlert,
  ADMIN: Scale,
  DONOR: Users,
  PRIVACY: Lock,
};

const categoryStyle: Record<string, string> = {
  SAFETY: "bg-red-500/10 text-red-500 border-red-500/20",
  ADMIN: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  DONOR: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  PRIVACY: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

export default function AdminPoliciesPage() {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [viewTarget, setViewTarget] = useState<Policy | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { data, isLoading } = useGetAllPoliciesQuery();
  const [deletePolicy] = useDeletePolicyMutation();
  const [updatePolicy] = useUpdatePolicyMutation();

  const policies = data?.data ?? [];

  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "All" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [policies, searchQuery, categoryFilter]);

  const totalPages = Math.ceil(filteredPolicies.length / itemsPerPage);
  const paginatedPolicies = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPolicies.slice(start, start + itemsPerPage);
  }, [filteredPolicies, currentPage]);

  const handleToggleActive = async (policy: Policy) => {
    try {
      await updatePolicy({
        id: policy.id,
        data: { active: !policy.active },
      }).unwrap();
      toast.success(`Policy ${policy.active ? "deactivated" : "activated"}`);
    } catch {
      toast.error("Failed to update policy");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePolicy(deleteTarget).unwrap();
      toast.success("Policy deleted");
    } catch {
      toast.error("Failed to delete policy");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-2">
        <DashboardHeader
          variant="clinical"
          title="Policies"
          subtitle="Create and update the rules that govern the platform."
          badge="Rules"
        />
        <UploadPolicyModal onSuccess={() => setCurrentPage(1)} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search policies..."
            className="h-14 pl-12 rounded-2xl shadow-none bg-white dark:bg-zinc-900/50 border border-border/40 font-bold"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-max min-w-48 py-7 rounded-2xl shadow-none bg-white dark:bg-zinc-900 border border-border/40 font-black text-xs uppercase px-6">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/40">
            <SelectItem value="All" className="font-bold">
              All Categories
            </SelectItem>
            {["SAFETY", "ADMIN", "DONOR", "PRIVACY"].map((cat) => (
              <SelectItem key={cat} value={cat} className="font-bold">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Policies Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 animate-pulse"
            />
          ))}

        {!isLoading && paginatedPolicies.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-40">
            <BookOpen className="size-16 mb-4 stroke-1" />
            <p className="text-xl font-black uppercase tracking-tighter">
              No Policies Found
            </p>
          </div>
        )}

        {!isLoading && (
          <AnimatePresence mode="popLayout">
            {paginatedPolicies.map((policy, i) => {
              const Icon = categoryIcons[policy.category] || BookOpen;
              return (
                <motion.div
                  key={policy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card
                    className={cn(
                      "rounded-[2.5rem] shadow-none border overflow-hidden hover:shadow-premium transition-all duration-300 group h-full",
                      policy.active
                        ? "border-border/40 bg-white dark:bg-zinc-950"
                        : "border-dashed border-border/20 bg-zinc-50/50 dark:bg-zinc-900/50 opacity-60",
                    )}
                  >
                    <CardContent className="p-7 space-y-5 flex flex-col h-full">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div
                          className={cn(
                            "size-12 rounded-2xl flex items-center justify-center border",
                            categoryStyle[policy.category],
                          )}
                        >
                          <Icon className="size-5" />
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            onClick={() => setViewTarget(policy)}
                          >
                            <Eye className="size-3.5" />
                          </Button>
                          <UploadPolicyModal
                            policy={policy}
                            trigger={
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              >
                                <Edit3 className="size-3.5" />
                              </Button>
                            }
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 rounded-xl hover:bg-red-500/10 text-red-500"
                            onClick={() => setDeleteTarget(policy.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            className={cn(
                              "rounded-full px-3 py-0.5 text-[8px] font-black uppercase  border",
                              categoryStyle[policy.category],
                            )}
                          >
                            {policy.category}
                          </Badge>
                          <Badge
                            className={cn(
                              "rounded-full px-3 py-0.5 text-[8px] font-black uppercase  border-none",
                              policy.active
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-zinc-500/10 text-zinc-500",
                            )}
                          >
                            {policy.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <h3 className="font-black text-lg tracking-tight uppercase leading-tight">
                          {policy.title}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 opacity-70">
                          {policy.description}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-border/20">
                        <div className="flex items-center gap-1 text-muted-foreground opacity-40">
                          <Clock className="size-3" />
                          <span className="text-[9px] font-bold uppercase">
                            {format(new Date(policy.updatedAt), "MMM dd, yyyy")}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(policy)}
                          className={cn(
                            "h-7 px-3 rounded-xl font-black text-[8px] uppercase ",
                            policy.active
                              ? "text-red-500 hover:bg-red-500/10"
                              : "text-emerald-500 hover:bg-emerald-500/10",
                          )}
                        >
                          {policy.active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">
            Page {currentPage} of {totalPages} · {filteredPolicies.length}{" "}
            policies
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase hover:bg-zinc-950 hover:text-white transition-all"
            >
              <ChevronLeft className="size-4 mr-2" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-10 px-4 rounded-xl border-border/40 font-black text-[9px] uppercase hover:bg-zinc-950 hover:text-white transition-all"
            >
              Next <ChevronRight className="size-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* View Dialog */}
      <Dialog
        open={!!viewTarget}
        onOpenChange={(o) => !o && setViewTarget(null)}
      >
        <DialogContent className="rounded-[2.5rem] border-border/40 p-8 max-w-lg">
          {viewTarget && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={cn(
                      "size-10 rounded-xl flex items-center justify-center border",
                      categoryStyle[viewTarget.category],
                    )}
                  >
                    {React.createElement(
                      categoryIcons[viewTarget.category] || BookOpen,
                      {
                        className: "size-4",
                      },
                    )}
                  </div>
                  <Badge
                    className={cn(
                      "rounded-full px-3 py-0.5 text-[8px] font-black uppercase  border",
                      categoryStyle[viewTarget.category],
                    )}
                  >
                    {viewTarget.category}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                  {viewTarget.title}
                </DialogTitle>
                <DialogDescription className="text-xs font-bold opacity-40">
                  Last updated:{" "}
                  {format(new Date(viewTarget.updatedAt), "MMMM dd, yyyy")}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900">
                <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                  {viewTarget.description}
                </p>
              </div>
              <DialogFooter className="mt-6">
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    className="h-12 rounded-2xl font-black text-[10px] uppercase  border-border/40"
                  >
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-[2.5rem] border-border/40 p-8 max-w-md">
          <AlertDialogHeader className="space-y-4">
            <div className="size-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <AlertCircle className="size-7" />
            </div>
            <div>
              <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">
                Delete Policy
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm font-medium text-muted-foreground/60 leading-relaxed">
                This will permanently remove the policy. This action cannot be
                undone.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-4 mt-8">
            <AlertDialogCancel asChild>
              <Button
                variant="outline"
                className="h-12 rounded-2xl font-black text-[10px] uppercase  border-border/40 shadow-none"
              >
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                onClick={confirmDelete}
                className="h-12 rounded-2xl font-black text-[10px] uppercase  bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
