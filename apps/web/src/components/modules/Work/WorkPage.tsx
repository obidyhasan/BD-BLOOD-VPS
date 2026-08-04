"use client";

import { useMemo, useState } from "react";
import { PaginationSection, paginateList } from "@/components/shared/Pagination/Pagination";
import WorkCard from "../Home/OurWork/WorkCard";
import { motion } from "motion/react";
import { Briefcase, Search } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader/PageHeader";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetPublicPostsQuery } from "@/redux/features/posts/postsApi";
import { mapApiPostToLegacy } from "@/lib/post";

const WorksPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const { data, isLoading } = useGetPublicPostsQuery({
    isWork: true,
    approvalStatus: "APPROVED",
    limit: 100,
  });

  const works = useMemo(() => {
    let items = (data?.data ?? []).map((p) => mapApiPostToLegacy(p));
    const q = searchQuery.toLowerCase();
    if (q) {
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content?.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q),
      );
    }
    items.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });
    return items;
  }, [data, searchQuery, sortOrder]);

  const { items: pagedWorks, total } = paginateList(works, page, pageSize);

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950/30 pb-10 md:pb-16">
      <PageHeader
        icon={<Briefcase className="size-3.5" />}
        badgeText="Impact Reports"
        titleBase="Our"
        titleSpan="Humanitarian"
        titleSuffix="Work"
        description="Discover the real-world impact of our blood donation campaigns, emergency operations, and community healthcare initiatives across the nation."
      />

      <div className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-12 h-14 rounded-2xl border-border/40 focus:border-primary transition-all text-base"
            />
          </div>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="py-6 bg-zinc-50 dark:bg-zinc-950 border border-primary/5 rounded-2xl px-5 text-sm font-bold focus:ring-4 focus:ring-primary/10 hover:border-primary/20 transition-all">
              <SelectValue placeholder="Sort by Newest" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest" className="font-medium text-sm py-3 cursor-pointer">Sort by Newest</SelectItem>
              <SelectItem value="oldest" className="font-medium text-sm py-3 cursor-pointer">Sort by Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[16/18] rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 animate-pulse border border-border/40 border-dashed" />
            ))
          ) : (
            pagedWorks.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <WorkCard post={post} />
              </motion.div>
            ))
          )}
        </div>

        {total > 0 && (
          <PaginationSection
            page={page}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default WorksPage;
