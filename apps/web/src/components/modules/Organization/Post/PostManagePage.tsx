"use client";

import * as React from "react";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { PostDataTable } from "./PostDataTable";
import { motion } from "motion/react";
import { useGetOrgPostsQuery } from "@/redux/features/posts/postsApi";
import { mapApiPostToModerationRow } from "@/lib/post";

const PostManagePage = () => {
  const { data, isLoading } = useGetOrgPostsQuery({ limit: 200 });

  const posts = React.useMemo(
    () => (data?.data ?? []).map((p) => mapApiPostToModerationRow(p)),
    [data],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <DashboardHeader
          variant="clinical"
          title="Posts"
          subtitle="Review and manage your organization's posts."
          badge="Signal Control"
        />
      </div>

      <div className="flex flex-col gap-6">
        {!isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <PostDataTable data={posts} />
          </motion.div>
        )}

        {isLoading && (
          <div className="h-[400px] w-full rounded-[3rem] border-2 border-dashed border-border/40 animate-pulse bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-center">
            <p className="text-[10px] font-black uppercase  text-muted-foreground opacity-40">Syncing Broadcasts...</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PostManagePage;
