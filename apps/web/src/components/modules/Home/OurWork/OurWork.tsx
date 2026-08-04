"use client";

import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import WorkCard from "./WorkCard";
import { useGetPublicPostsQuery } from "@/redux/features/posts/postsApi";
import { mapApiPostToLegacy } from "@/lib/post";
import type { Post } from "@/redux/features/posts/postsApi";

type OurWorkProps = {
  initialPosts?: Post[];
};

export default function OurWork({ initialPosts }: OurWorkProps) {
  const { data, isLoading } = useGetPublicPostsQuery(
    {
      isWork: true,
      approvalStatus: "APPROVED",
      limit: 6,
    },
    { skip: !!initialPosts?.length },
  );

  const apiWorks = (initialPosts ?? data?.data ?? []).map((p) =>
    mapApiPostToLegacy(p),
  );
  const loading = !initialPosts?.length && isLoading;

  return (
    <section id="work" className="relative py-10 md:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-8">
        <SectionHeader
          title="Our Success Stories"
          subtitle="Explore the real-world impact of our donor network and verified success stories from across the nation."
          button={{
            text: "Explore All Works",
            href: "/work",
            variant: "outline",
          }}
        />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="aspect-16/18 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-800 animate-pulse border border-border/40 border-dashed"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {apiWorks.map((work) => (
                <WorkCard key={work.id} post={work} />
              ))}
            </div>

            {!isLoading && apiWorks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center opacity-40">
                <p className="text-sm font-black uppercase  ">
                  Indexing humanitarian efforts...
                </p>
                <p className="text-[10px] mt-2 font-bold ">
                  Check back soon for latest success stories
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
