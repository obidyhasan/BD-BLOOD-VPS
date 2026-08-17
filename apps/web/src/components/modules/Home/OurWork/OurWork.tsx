"use client";

import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import WorkCard from "./WorkCard";
import { mapApiPostToLegacy } from "@/lib/post";
import {
  type Post,
  useGetHomepagePostsQuery,
} from "@/redux/features/posts/postsApi";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type OurWorkProps = {
  initialPosts?: Post[];
};

export default function OurWork({ initialPosts = [] }: OurWorkProps) {
  const query = useGetHomepagePostsQuery(undefined, {
    skip: initialPosts.length > 0,
  });
  const source = initialPosts.length > 0
    ? initialPosts
    : query.data?.data.successHistory ?? [];
  const apiWorks = source.map((post) => mapApiPostToLegacy(post));
  const loading = initialPosts.length === 0 && query.isLoading;

  return (
    <section id="work" className="relative py-10 md:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-8">
        <SectionHeader
          title="Our Success History"
          subtitle="Stories and updates shared by BD Blood organizations and administrators."
          button={{
            text: "Explore All Posts",
            href: "/post",
            variant: "outline",
          }}
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" aria-label="Loading success history">
            {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-96 animate-pulse rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-900" />)}
          </div>
        ) : query.isError ? (
          <div className="rounded-[2.5rem] border border-dashed border-red-500/30 py-16 text-center">
            <AlertCircle className="mx-auto mb-3 size-8 text-red-500" />
            <p className="mb-4 font-bold">Success history could not be loaded.</p>
            <Button variant="outline" onClick={() => void query.refetch()}><RefreshCw className="mr-2 size-4" />Try again</Button>
          </div>
        ) : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {apiWorks.map((work) => (
            <WorkCard key={work.id} post={work} />
          ))}
        </div>}

        {!loading && !query.isError && apiWorks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center opacity-40">
            <p className="text-sm font-black uppercase">
              Success history is being prepared
            </p>
            <p className="text-[10px] mt-2 font-bold">
              Check back soon for approved organization updates
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
