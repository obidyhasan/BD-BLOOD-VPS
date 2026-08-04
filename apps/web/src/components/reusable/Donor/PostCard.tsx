"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Heart,
  Share2,
  ShieldCheck,
  ArrowUpRight,
  Globe,
  Lock,
  Loader2,
} from "lucide-react";
import { PostActions } from "./PostActions";
import { PostImageCarousel } from "./PostImageCarousel";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "motion/react";
import type { LegacyPost as Post } from "@/lib/post";
import { getPostPath } from "@/lib/post";
import { cn } from "@/lib/utils";
import { useTogglePostLikeMutation } from "@/redux/features/posts/postsApi";
import { extractErrorMessage } from "@/lib/apiError";

interface PostCardProps {
  isModify?: boolean;
  showModeration?: boolean;
  post: Post;
}

const PostCard = ({ isModify, showModeration, post }: PostCardProps) => {
  const postPath = getPostPath(post, { fromDashboard: isModify });
  const canLike = post.status === "Published";
  const [optimisticLikeCount, setOptimisticLikeCount] = useState<number | null>(
    null,
  );
  const likeCount = optimisticLikeCount ?? post.likeCount ?? 0;
  const [toggleLike, { isLoading: liking }] = useTogglePostLikeMutation();

  const getStatusConfig = (status: Post["status"]) => {
    switch (status) {
      case "Published":
        return {
          label: "Live",
          className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        };
      case "Pending":
        return {
          label: "Reviewing",
          className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        };
      case "Draft":
        return {
          label: "Draft",
          className:
            "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground border-border/40",
        };
      case "Rejected":
        return {
          label: "Rejected",
          className: "bg-red-500/10 text-red-500 border-red-500/20",
        };
      default:
        return {
          label: status,
          className: "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground",
        };
    }
  };

  const statusConfig = getStatusConfig(post.status);
  const commentCount = post.commentCount ?? 0;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canLike) {
      toast.info("Likes are available once the post is published");
      return;
    }
    const target = post.slug ?? post.id;
    try {
      const res = await toggleLike(target).unwrap();
      setOptimisticLikeCount(res.data.likeCount);
    } catch (err: unknown) {
      const message = extractErrorMessage(err, "Failed to update like");
      if (
        message.toLowerCase().includes("token") ||
        message.toLowerCase().includes("unauthorized")
      ) {
        toast.info("Please log in to like posts");
      } else {
        toast.error(message);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group h-full"
    >
      <div className="h-full rounded-[2.5rem] border border-border/40 bg-white dark:bg-zinc-950 overflow-hidden hover:border-primary/20 transition-all duration-300 flex flex-col">
        <div className="p-6 pb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="flex size-10 items-center justify-center rounded-xl border border-border/40 bg-primary/10 text-sm font-black text-primary">
                {post.author.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 size-4 bg-emerald-500 border-2 border-white dark:border-zinc-950 rounded-full flex items-center justify-center">
                <ShieldCheck className="size-2 text-white" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-black text-foreground tracking-tight">
                {post.author}
              </h4>
              <div className="flex items-center gap-2">
                <p className="text-[9px] text-muted-foreground uppercase font-black  opacity-60">
                  Verified Donor
                </p>
                <span className="size-1 rounded-full bg-border" />
                <div className="flex items-center gap-1 text-muted-foreground opacity-60">
                  {post.visibility === "Public" ? (
                    <Globe className="size-2.5" />
                  ) : (
                    <Lock className="size-2.5" />
                  )}
                  <span className="text-[9px] font-black uppercase ">
                    {post.visibility}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "rounded-full px-3 py-1 text-[8px] font-black uppercase  border shadow-none",
                statusConfig.className,
              )}
            >
              {statusConfig.label}
            </Badge>
            {isModify && (
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg text-muted-foreground opacity-40 hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
              >
                <PostActions post={post} showModeration={showModeration} />
              </Button>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden bg-zinc-100 dark:bg-zinc-900 group/media mx-6 rounded-2xl border border-border/40">
          {post.images && post.images.length > 0 ? (
            <>
              <PostImageCarousel
                images={post.images}
                alt={post.title}
                className="rounded-2xl"
                imageClassName="transition-transform duration-700 group-hover/media:scale-110"
                showControls={post.images.length > 1}
              />
              <Link
                href={postPath}
                className="absolute top-3 right-3 z-20 size-10 rounded-full bg-black/40 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                aria-label="View post"
              >
                <ArrowUpRight className="size-5" />
              </Link>
            </>
          ) : (
            <Link
              href={postPath}
              className="block aspect-[16/9] h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-900"
            >
              <div className="flex flex-col items-center gap-2 opacity-10">
                <Globe className="size-12" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                  {post.type}
                </span>
              </div>
            </Link>
          )}
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <Link href={postPath} className="block group/title mb-3">
            <h3 className="text-lg font-black text-foreground leading-tight tracking-tight group-hover/title:text-primary transition-colors line-clamp-2">
              {post.title}
            </h3>
          </Link>
          <p className="text-xs font-medium text-muted-foreground leading-relaxed line-clamp-3 opacity-80 mb-6">
            {post.content ||
              "No details provided for this post. Check back later for more information."}
          </p>

          <div className="mt-auto pt-6 border-t border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={handleLike}
                disabled={liking || !canLike}
                className="flex items-center gap-2 text-muted-foreground hover:text-rose-500 transition-all group/stat disabled:opacity-50"
              >
                {liking ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Heart className="size-4 group-hover/stat:fill-rose-500 transition-all" />
                )}
                <span className="text-[10px] font-black ">
                  {likeCount.toLocaleString()}
                </span>
              </button>
              <Link
                href={postPath}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all group/stat"
              >
                <MessageCircle className="size-4" />
                <span className="text-[10px] font-black ">
                  {commentCount.toLocaleString()}
                </span>
              </Link>
            </div>

            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  void navigator.share({
                    title: post.title,
                    url: `${window.location.origin}${postPath}`,
                  });
                } else {
                  void navigator.clipboard.writeText(
                    `${window.location.origin}${postPath}`,
                  );
                  toast.success("Link copied to clipboard");
                }
              }}
              className="text-muted-foreground hover:text-primary transition-all p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <Share2 className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PostCard;
