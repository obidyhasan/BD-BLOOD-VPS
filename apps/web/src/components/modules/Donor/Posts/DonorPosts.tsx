"use client";

import { useState, useMemo } from "react";
import { useGetMyPostsQuery } from "@/redux/features/posts/postsApi";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { mapApiPostToLegacy } from "@/lib/post";
import type { LegacyPost as Post } from "@/lib/post";
import PostCard from "@/components/reusable/Donor/PostCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostDialog } from "@/components/reusable/Donor/PostDialog";
import { PostCardSkeleton } from "@/components/reusable/Donor/PostCardSkeleton";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const DonorPosts = () => {
  const { data, isLoading, isFetching } = useGetMyPostsQuery({ limit: 100 });
  const { data: meData } = useGetMeQuery();
  const loading = isLoading || (isFetching && !data);
  const posts: Post[] = useMemo(
    () => (data?.data ?? []).map((p) => mapApiPostToLegacy(p)),
    [data],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch = post.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      let matchesTab = true;
      if (activeTab === "live") matchesTab = post.status === "Published";
      else if (activeTab === "pending") matchesTab = post.status === "Pending";
      else if (activeTab === "draft") matchesTab = post.status === "Draft";
      else if (activeTab === "private")
        matchesTab = post.visibility === "Private";

      return matchesSearch && matchesTab;
    });
  }, [posts, searchQuery, activeTab]);

  return (
    <div className="space-y-8 mt-10">
      {/* Search and Filter Bar */}
      <div className="flex flex-col xl:flex-row gap-6 items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="relative w-full xl:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search posts..."
            className="pl-11 h-14 rounded-2xl bg-white dark:bg-zinc-950 border-border/40 focus:ring-primary/20 font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full xl:w-auto"
          >
            <TabsList className="h-14 p-1.5 bg-white dark:bg-zinc-950 rounded-2xl border border-border/40">
              <TabsTrigger
                value="all"
                className="rounded-xl px-5 text-[9px] font-black uppercase  leading-none"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="live"
                className="rounded-xl px-5 text-[9px] font-black uppercase  leading-none flex items-center gap-2"
              >
                <div className="size-1.5 rounded-full bg-emerald-500" /> Live
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="rounded-xl px-5 text-[9px] font-black uppercase  leading-none"
              >
                Review
              </TabsTrigger>
              <TabsTrigger
                value="draft"
                className="rounded-xl px-5 text-[9px] font-black uppercase  leading-none"
              >
                Draft
              </TabsTrigger>
              <TabsTrigger
                value="private"
                className="rounded-xl px-5 text-[9px] font-black uppercase  leading-none flex items-center gap-2"
              >
                Private
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="hidden sm:flex border-l border-border/40 pl-4 gap-1 h-10 items-center">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-10 rounded-xl",
                viewMode === "grid"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground",
              )}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-10 rounded-xl",
                viewMode === "list"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground",
              )}
              onClick={() => setViewMode("list")}
            >
              <ListIcon className="size-4" />
            </Button>
          </div>

          <div className="flex-1 xl:flex-none">
            <PostDialog
              donationOnly
              trigger={
                <Button
                  disabled={!meData?.data?.capabilities?.canCreateDonationPost}
                  title={
                    meData?.data?.capabilities?.canCreateDonationPost
                      ? undefined
                      : "Complete your profile and verify a donation before creating a donation post."
                  }
                  className="w-full h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.1em] bg-primary text-white dark:bg-primary dark:text-white hover:bg-primary/80 dark:hover:bg-primary/80 shadow-xl transition-all hover:scale-[1.02] active:scale-95 border-none"
                >
                  Create Post
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {/* Posts Grid/List */}
      {loading ? (
        <div
          className={cn(
            "grid gap-8",
            viewMode === "grid"
              ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-1",
          )}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="py-32 text-center space-y-6">
          <div className="size-24 rounded-[3rem] bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mx-auto opacity-10 border-2 border-dashed border-border/60">
            <ClipboardList className="size-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black uppercase tracking-tight">
              No Results Found
            </h3>
            <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto">
              We couldn&apos;t find any signals matching your current filters.
              Try searching for something else.
            </p>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div
            className={cn(
              "grid gap-8",
              viewMode === "grid"
                ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
                : "grid-cols-1",
            )}
          >
            {filteredPosts.map((post, i) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <PostCard isModify={true} post={post} />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default DonorPosts;
