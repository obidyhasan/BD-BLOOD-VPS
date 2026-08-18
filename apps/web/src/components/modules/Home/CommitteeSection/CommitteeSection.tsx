"use client";

import SectionHeader from "@/components/shared/SectionHeader/SectionHeader";
import WorkCard from "@/components/modules/Home/OurWork/WorkCard";
import { mapApiPostToLegacy } from "@/lib/post";
import {
  type Post,
  useGetHomepagePostsQuery,
} from "@/redux/features/posts/postsApi";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type CommitteeSectionProps = {
  initialPosts?: Post[];
};

const CommitteeSection = ({ initialPosts = [] }: CommitteeSectionProps) => {
  const query = useGetHomepagePostsQuery(undefined, {
    skip: initialPosts.length > 0,
  });
  const source =
    initialPosts.length > 0
      ? initialPosts
      : (query.data?.data.donorPosts ?? []);
  const posts = source.map((post) => mapApiPostToLegacy(post));
  const loading = initialPosts.length === 0 && query.isLoading;

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
            href: "/post?scope=donor",
            variant: "outline",
          }}
        />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading &&
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-96 animate-pulse rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-900"
              />
            ))}
          {!loading &&
            !query.isError &&
            posts.map((post) => <WorkCard key={post.id} post={post} />)}
          {query.isError && (
            <div className="col-span-full rounded-[2.5rem] border border-dashed border-red-500/30 py-16 text-center">
              <AlertCircle className="mx-auto mb-3 size-8 text-red-500" />
              <p className="mb-4 font-bold">Donor posts could not be loaded.</p>
              <Button variant="outline" onClick={() => void query.refetch()}>
                <RefreshCw className="mr-2 size-4" />
                Try again
              </Button>
            </div>
          )}
          {!loading && !query.isError && posts.length === 0 && (
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
