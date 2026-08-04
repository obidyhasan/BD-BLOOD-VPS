"use client";

import { useState, useMemo, useEffect } from "react";
import {
  useGetAdminPostsQuery,
  useTogglePostWorkMutation,
} from "@/redux/features/posts/postsApi";
import { mapApiPostToLegacy } from "@/lib/post";
import type { LegacyPost as Post } from "@/lib/post";
import WorkCard from "@/components/modules/Home/OurWork/WorkCard";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import {
  Search,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Hash,
  Briefcase,
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
import { toast } from "sonner";
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

const PAGE_SIZE = 8;

const AdminWorkPage = () => {
  const { data, isLoading: loading } = useGetAdminPostsQuery({
    limit: 200,
    approvalStatus: "APPROVED",
  });
  const [toggleWork] = useTogglePostWorkMutation();

  const posts: Post[] = useMemo(
    () => (data?.data ?? []).map((p) => mapApiPostToLegacy(p)),
    [data],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const postTypes = [
    "URGENT",
    "EMERGENCY",
    "EVENT",
    "ANNOUNCEMENT",
    "GENERAL",
    "RECAP",
  ];
  const postStatuses = ["Published"];

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.org.toLowerCase().includes(q) ||
        (p.content && p.content.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      const matchesType = typeFilter === "All" || p.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [posts, searchQuery, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleToggleWork = (id: string) => {
    setPendingToggleId(id);
    setIsConfirmOpen(true);
  };

  const confirmToggle = async () => {
    if (!pendingToggleId) return;

    try {
      const post = posts.find((p) => p.id === pendingToggleId);
      const wasWork = post?.isWork;

      await toggleWork({ id: pendingToggleId, isWork: !wasWork }).unwrap();

      if (wasWork) {
        toast.info("Post removed from Our Work");
      } else {
        toast.success("Post added to Our Work section");
      }
    } catch (error) {
      toast.error("Failed to update work status");
    } finally {
      setIsConfirmOpen(false);
      setPendingToggleId(null);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <DashboardHeader
          variant="clinical"
          title="Our Work"
          subtitle="Choose posts to feature in the public 'Our Work' gallery."
          badge="Impact"
        />

        <div className="flex flex-wrap items-center gap-4">
          <div className="py-2 px-4 rounded-3xl bg-white dark:bg-zinc-900 border border-border/40 shadow-premium flex items-center gap-4">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Briefcase className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40">
                Featured Works
              </p>
              <p className="text-xl font-black tracking-tighter">
                {posts.filter((p) => p.isWork).length}
              </p>
            </div>
          </div>
          {/* <AdminPostModal /> */}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-4"
      >
        <div className="relative flex-1 min-w-full sm:min-w-[300px] border border-border/40  rounded-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, author, org or content..."
            className="h-14 pl-12 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="border border-border/40 rounded-2xl py-7 w-[160px] dark:bg-zinc-950/50 font-black text-xs uppercase px-6">
              <SelectValue placeholder="Post Type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40 shadow-premium">
              <SelectItem value="All" className="font-bold rounded-lg my-1">
                All Types
              </SelectItem>
              {postTypes.map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                  className="font-bold rounded-lg my-1"
                >
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border border-border/40 rounded-2xl py-7 w-[160px] dark:bg-zinc-950/50 font-black text-xs uppercase px-6">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40 shadow-premium">
              <SelectItem value="All" className="font-bold rounded-lg my-1">
                All Status
              </SelectItem>
              {postStatuses.map((status) => (
                <SelectItem
                  key={status}
                  value={status}
                  className="font-bold rounded-lg my-1"
                >
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[16/18] rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 animate-pulse border border-border/40 border-dashed"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginated.map((post) => (
              <WorkCard
                key={post.id}
                post={post}
                isAdmin={true}
                onToggleWork={handleToggleWork}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="size-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Hash className="size-10" />
              </div>
              <p className="text-xl font-black uppercase tracking-tighter">
                No broadcasts found
              </p>
              <p className="text-sm text-muted-foreground font-medium mt-2 opacity-60">
                Try adjusting your search or filter criteria in this sector.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pt-6">
              <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">
                Page {currentPage} of {totalPages} · {filtered.length} posts
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
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
        </>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-border/40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">
              {posts.find((p) => p.id === pendingToggleId)?.isWork
                ? "Remove from Featured Work?"
                : "Feature as Humanitarian Work?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-muted-foreground leading-relaxed">
              {posts.find((p) => p.id === pendingToggleId)?.isWork
                ? "This report will be removed from the public humanitarian work gallery and home page section."
                : "This broadcast will be featured in the public humanitarian work gallery as a success story."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-12 rounded-2xl border-border/40 font-bold text-xs uppercase  px-6">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggle}
              className="h-12 rounded-2xl bg-primary text-white hover:bg-emerald-600 font-bold text-xs uppercase  px-6 border-none shadow-xl shadow-primary/20"
            >
              Confirm Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminWorkPage;
