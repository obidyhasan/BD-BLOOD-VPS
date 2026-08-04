"use client";

import { useState, useMemo } from "react";
import PostCard from "@/components/reusable/Donor/PostCard";
import { mapApiPostToLegacy } from "@/lib/post";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import {
  Search,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Hash,
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
import { useGetAdminPostsQuery } from "@/redux/features/posts/postsApi";

const PAGE_SIZE = 8;
const postTypes = [
  "URGENT",
  "EMERGENCY",
  "EVENT",
  "ANNOUNCEMENT",
  "GENERAL",
  "RECAP",
  "DONATION",
  "HELP_REQUEST",
  "SOCIAL_ACTIVITY",
];
const postStatuses = ["APPROVED", "PENDING", "REJECTED"];

const AdminPostsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useGetAdminPostsQuery({ limit: 500 });
  const posts = data?.data ?? [];

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.donor.fullName.toLowerCase().includes(q) ||
        (p.organization?.name || "").toLowerCase().includes(q) ||
        (p.content || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "All" || p.approvalStatus === statusFilter;
      const matchesType = typeFilter === "All" || p.postType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [posts, searchQuery, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <DashboardHeader
          variant="clinical"
          title="Posts"
          subtitle="Review and moderate posts from all organizations and donors."
          badge="Content Control"
        />

        <div className="flex flex-wrap items-center gap-4">
          <div className="py-2 px-4 rounded-3xl bg-white dark:bg-zinc-900 border border-border/40 shadow-premium flex items-center gap-4">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40">
                Total Posts
              </p>
              <p className="text-xl font-black tracking-tighter">
                {posts.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-4"
      >
        <div className="relative flex-1 min-w-full sm:min-w-[300px] border border-border/40 rounded-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by title, author, org..."
            className="h-14 pl-12 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={typeFilter}
            onValueChange={handleFilterChange(setTypeFilter)}
          >
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

          <Select
            value={statusFilter}
            onValueChange={handleFilterChange(setStatusFilter)}
          >
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

      {isLoading ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[3/4] rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 animate-pulse border border-border/40 border-dashed"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginated.map((post) => (
              <PostCard
                key={post.id}
                post={mapApiPostToLegacy(post)}
                isModify={true}
                showModeration={true}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="size-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Hash className="size-10" />
              </div>
              <p className="text-xl font-black uppercase ">No Posts found</p>
              <p className="text-sm text-muted-foreground font-medium mt-2 opacity-60">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}

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
    </div>
  );
};

export default AdminPostsPage;
