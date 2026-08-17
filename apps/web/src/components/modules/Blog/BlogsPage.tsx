"use client";

import { Search, Activity, Loader2 } from "lucide-react";
import { PaginationSection } from "@/components/shared/Pagination/Pagination";
import { Input } from "@/components/ui/input";
import { BlogCard } from "@/components/shared/BlogCard/BlogCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import PageHeader from "@/components/shared/PageHeader/PageHeader";
import { useGetPublicBlogsQuery } from "@/redux/features/blogs/blogsApi";
import { mapApiBlog } from "@/lib/blog";
import type { BlogType } from "@/redux/features/blogs/blogsApi";

type BlogsListResponse = {
  success?: boolean;
  data?: BlogType[];
  meta?: { total?: number; page?: number; limit?: number };
};

type BlogsPageProps = {
  initialData?: BlogsListResponse;
};

const BlogsPage = ({ initialData }: BlogsPageProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [sortOrder, setSortOrder] = useState("newest");

  const { data, isLoading } = useGetPublicBlogsQuery({
    page,
    limit: pageSize,
    searchTerm: searchQuery || undefined,
    sortBy: "created_at",
    sortOrder: sortOrder === "newest" ? "desc" : "asc",
  });

  const resolvedData = data ?? initialData;
  const blogs = useMemo(() => (resolvedData?.data ?? []).map(mapApiBlog), [resolvedData]);
  const total = resolvedData?.meta?.total ?? blogs.length;
  const loading = !resolvedData && isLoading;

  return (
    <div className="min-h-screen bg-white pb-10 md:pb-16">
      <PageHeader
        icon={<Activity className="size-3.5" />}
        badgeText="Health Awareness"
        titleBase="Latest"
        titleSpan="News"
        titleSuffix="& Stories"
        description="Read inspiring stories about life-saving blood donations and stay updated with medical news across Bangladesh."
      />
      <div className="max-w-7xl mx-auto px-6 space-y-16">
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
            <SelectTrigger className="py-6 bg-zinc-50 dark:bg-zinc-950 border border-primary/5 rounded-2xl px-5 text-sm font-bold 
      focus:ring-4 focus:ring-primary/10 hover:border-primary/20 transition-all">
              <SelectValue placeholder="Sort by Newest" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog, index) => (
              <BlogCard key={blog.id} blog={blog} index={index} />
            ))}
          </div>
        )}

        {!loading && blogs.length === 0 && (
          <p className="text-center text-muted-foreground font-medium py-12">
            No articles found.
          </p>
        )}

        {total > 0 && (
          <PaginationSection
            page={page}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </div>
  );
};

export default BlogsPage;
