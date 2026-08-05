"use client";

import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import WorkCard from "@/components/modules/Home/OurWork/WorkCard";
import { mapApiPostToLegacy } from "@/lib/post";
import type { Post } from "@/redux/features/posts/postsApi";

type CommitteeSectionProps = {
  initialPosts?: Post[];
};

const CommitteeSection = ({ initialPosts = [] }: CommitteeSectionProps) => {
  const posts = initialPosts.map((post) => mapApiPostToLegacy(post));

  return (
    <section
      id="donor-posts"
      className="py-10 md:py-16 bg-white dark:bg-zinc-950"
    >
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          title="Donor Posts"
          subtitle="Approved public donation stories shared by donors across BD Blood organizations."
          button={{
            text: "All Posts",
            href: "/post",
            variant: "outline",
          }}
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {posts.map((post) => (
            <WorkCard key={post.id} post={post} />
          ))}
          {posts.length === 0 && (
            <div className="col-span-full py-24 text-center border border-dashed rounded-[3rem] border-border/40">
              <p className="text-xl font-black uppercase tracking-tighter opacity-20">
                No approved donor posts found.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CommitteeSection;
