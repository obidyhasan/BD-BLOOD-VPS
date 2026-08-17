"use client";

import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import { BlogCard } from "@/components/shared/BlogCard/BlogCard";
import { useGetPublicBlogsQuery } from "@/redux/features/blogs/blogsApi";
import { mapApiBlog } from "@/lib/blog";
import type { BlogType } from "@/redux/features/blogs/blogsApi";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type OurBlogsProps = {
  initialBlogs?: BlogType[];
};

export default function OurBlogs({ initialBlogs }: OurBlogsProps) {
  const { data, isLoading, isError, refetch } = useGetPublicBlogsQuery(
    {
      limit: 3,
      status: "APPROVED",
      sortBy: "created_at",
      sortOrder: "desc",
    },
    { skip: !!initialBlogs?.length },
  );

  const displayBlogs = (initialBlogs?.length ? initialBlogs : data?.data ?? []).map(mapApiBlog);
  const loading = !initialBlogs?.length && isLoading;

  return (
    <section id="blogs" className="py-10 md:py-16 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          title="Education & Stories"
          subtitle="Learn about blood donation and read heart-touching stories from our heroes."
          button={{
            text: "View All Articles",
            href: "/blog",
            variant: "outline",
          }}
        />
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* {blogs.slice(0, 3).map((blog, idx) => (
            <BlogCard key={blog.slug || idx} blog={blog} index={idx} />
          ))} */}
          {isError ? (
            <div className="col-span-full rounded-[2.5rem] border border-dashed border-red-500/30 py-16 text-center">
              <AlertCircle className="mx-auto mb-3 size-8 text-red-500" />
              <p className="mb-4 font-bold">Articles could not be loaded.</p>
              <Button variant="outline" onClick={() => void refetch()}><RefreshCw className="mr-2 size-4" />Try again</Button>
            </div>
          ) : loading
            ? [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-80 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 animate-pulse border border-border/40 border-dashed"
                />
              ))
            : displayBlogs.map((blog, idx) => (
                <BlogCard key={blog.id || idx} blog={blog} index={idx} />
              ))}
        </div>
      </div>
    </section>
  );
}
