"use client";

import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import WorkCard from "./WorkCard";
import { mapApiPostToLegacy } from "@/lib/post";
import type { Post } from "@/redux/features/posts/postsApi";

type OurWorkProps = {
  initialPosts?: Post[];
};

export default function OurWork({ initialPosts = [] }: OurWorkProps) {
  const apiWorks = initialPosts.map((post) => mapApiPostToLegacy(post));

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {apiWorks.map((work) => (
            <WorkCard key={work.id} post={work} />
          ))}
        </div>

        {apiWorks.length === 0 && (
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
