"use client";

import { useMemo, useState } from "react";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  HelpCircle,
  MessageCircleQuestion,
  Search,
  Trash2,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import FaqModal from "@/components/modules/Admin/Faq/FaqModal";
import {
  useDeleteFaqMutation,
  useGetAllFaqsQuery,
  useUpdateFaqMutation,
  type Faq,
} from "@/redux/features/faqs/faqsApi";

export default function AdminFaqsPage() {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { data, isLoading } = useGetAllFaqsQuery({
    limit: 200,
    sortBy: "order",
    sortOrder: "asc",
  });
  const [deleteFaq] = useDeleteFaqMutation();
  const [updateFaq] = useUpdateFaqMutation();

  const faqs = useMemo(() => data?.data ?? [], [data?.data]);

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const query = searchQuery.toLowerCase();
      return (
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        (faq.category ?? "").toLowerCase().includes(query)
      );
    });
  }, [faqs, searchQuery]);

  const totalPages = Math.ceil(filteredFaqs.length / itemsPerPage);
  const paginatedFaqs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFaqs.slice(start, start + itemsPerPage);
  }, [filteredFaqs, currentPage]);

  const handleToggleActive = async (faq: Faq) => {
    try {
      await updateFaq({ id: faq.id, data: { active: !faq.active } }).unwrap();
      toast.success(`FAQ ${faq.active ? "deactivated" : "activated"}`);
    } catch {
      toast.error("Failed to update FAQ");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFaq(deleteTarget).unwrap();
      toast.success("FAQ deleted");
    } catch {
      toast.error("Failed to delete FAQ");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-2">
        <DashboardHeader
          variant="clinical"
          title="FAQ Management"
          subtitle="Create and manage the FAQs shown on the homepage."
          badge="Content"
        />
        <FaqModal onSuccess={() => setCurrentPage(1)} />
      </div>

      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
        <Input
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search FAQs..."
          className="h-14 pl-12 rounded-2xl shadow-none bg-white dark:bg-zinc-900/50 border border-border/40 font-bold"
        />
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 animate-pulse"
            />
          ))}

        {!isLoading && paginatedFaqs.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-40">
            <MessageCircleQuestion className="size-16 mb-4 stroke-1" />
            <p className="text-xl font-black uppercase tracking-tighter">
              No FAQs Found
            </p>
          </div>
        )}

        {!isLoading && (
          <AnimatePresence mode="popLayout">
            {paginatedFaqs.map((faq, i) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card
                  className={cn(
                    "rounded-[2.5rem] shadow-none border overflow-hidden hover:shadow-premium transition-all duration-300 group h-full",
                    faq.active
                      ? "border-border/40 bg-white dark:bg-zinc-950"
                      : "border-dashed border-border/20 bg-zinc-50/50 dark:bg-zinc-900/50 opacity-60",
                  )}
                >
                  <CardContent className="p-7 space-y-5 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-4">
                      <div className="size-12 rounded-2xl flex items-center justify-center border bg-primary/10 text-primary border-primary/20">
                        <HelpCircle className="size-5" />
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <FaqModal
                          faq={faq}
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
                          onClick={() => setDeleteTarget(faq.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {faq.category && (
                          <Badge className="rounded-full px-3 py-0.5 text-[8px] font-black uppercase  border bg-blue-500/10 text-blue-500 border-blue-500/20">
                            {faq.category}
                          </Badge>
                        )}
                        <Badge
                          className={cn(
                            "rounded-full px-3 py-0.5 text-[8px] font-black uppercase  border-none",
                            faq.active
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-zinc-500/10 text-zinc-500",
                          )}
                        >
                          {faq.active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge className="rounded-full px-3 py-0.5 text-[8px] font-black uppercase  border-none bg-zinc-500/10 text-zinc-500">
                          Order {faq.order}
                        </Badge>
                      </div>
                      <h3 className="font-black text-lg tracking-tight uppercase leading-tight">
                        {faq.question}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 opacity-70">
                        {faq.answer}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/20">
                      <div className="flex items-center gap-1 text-muted-foreground opacity-40">
                        <Clock className="size-3" />
                        <span className="text-[9px] font-bold uppercase">
                          {format(new Date(faq.updatedAt), "MMM dd, yyyy")}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(faq)}
                        className={cn(
                          "h-7 px-3 rounded-xl font-black text-[8px] uppercase ",
                          faq.active
                            ? "text-red-500 hover:bg-red-500/10"
                            : "text-emerald-500 hover:bg-emerald-500/10",
                        )}
                      >
                        {faq.active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">
            Page {currentPage} of {totalPages} · {filteredFaqs.length} FAQs
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
                Delete FAQ
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm font-medium text-muted-foreground/60 leading-relaxed">
                This will permanently remove the FAQ from the content hub.
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
