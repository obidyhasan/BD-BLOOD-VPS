"use client";

import { extractErrorMessage } from "@/lib/apiError";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Heart, Share2, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useGetPublicPostBySlugQuery,
  useGetMyPostBySlugQuery,
  useTogglePostLikeMutation,
  type Post as ApiPost,
} from "@/redux/features/posts/postsApi";
import { mapApiPostToLegacy } from "@/lib/post";
import { PostImageCarousel } from "@/components/reusable/Donor/PostImageCarousel";
import { PostCommentsSection } from "@/components/reusable/Donor/PostCommentsSection";
import { PostActions } from "@/components/reusable/Donor/PostActions";

const PostDetail = ({
  slug,
  initialPost,
  isPreview = false,
  backHref = "/post",
  backLabel = "← Back to posts",
}: {
  slug?: string;
  initialPost?: ApiPost | null;
  isPreview?: boolean;
  backHref?: string;
  backLabel?: string;
}) => {
  const publicQuery = useGetPublicPostBySlugQuery(slug ?? "", {
    skip: !slug || isPreview || !!initialPost,
  });
  const previewQuery = useGetMyPostBySlugQuery(slug ?? "", {
    skip: !slug || !isPreview || !!initialPost,
  });

  const activeQuery = isPreview ? previewQuery : publicQuery;
  const { data, isLoading, isError, refetch } = activeQuery;

  const [toggleLike, { isLoading: liking }] = useTogglePostLikeMutation();

  const apiPost = data?.data ?? initialPost ?? null;
  const post = apiPost ? mapApiPostToLegacy(apiPost) : null;
  const likeCount = apiPost?._count?.likes ?? post?.likeCount ?? 0;
  const canInteract = post?.status === "Published";

  const handleLike = async () => {
    if (!canInteract) {
      toast.info("Likes are available once the post is published");
      return;
    }
    if (!slug) return;
    try {
      const res = await toggleLike(slug).unwrap();
      toast.success(res.data.liked ? "Post liked" : "Like removed");
      refetch();
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

  if (isLoading && !initialPost) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center mt-28">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 mt-28">
        <p className="text-xl font-black uppercase tracking-tighter">
          Post Not Found
        </p>
        <Link href={backHref}>
          <Button variant="outline" className="rounded-xl">
            Go Back
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-white dark:bg-zinc-950 pb-16 ${isPreview ? "" : "pt-28"}`}
    >
      <div className="max-w-4xl mx-auto px-6 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={backHref}
            className="text-xs font-black uppercase  text-primary"
          >
            {backLabel}
          </Link>
          {isPreview && <PostActions post={post} />}
        </div>

        {isPreview && post.status !== "Published" && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs font-bold text-amber-600 uppercase ">
            Preview mode — this post is {post.status.toLowerCase()} and not
            visible publicly yet.
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="rounded-full">{post.type}</Badge>
            <Badge variant="outline" className="rounded-full">
              {post.visibility}
            </Badge>
            {isPreview && (
              <Badge variant="outline" className="rounded-full">
                {post.status}
              </Badge>
            )}
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
              <CalendarDays className="size-3" />
              {post.date}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none">
            {post.title}
          </h1>

          <p className="text-muted-foreground font-medium">
            By {post.author}
            {post.org ? ` · ${post.org}` : ""}
          </p>

          {post.images && post.images.length > 0 && (
            <PostImageCarousel
              images={post.images}
              alt={post.title}
              className="rounded-2xl border border-border/40 overflow-hidden"
              showControls={post.images.length > 1}
            />
          )}

          <div className="prose prose-zinc dark:prose-invert max-w-none text-muted-foreground text-lg leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="rounded-xl gap-2"
              onClick={() =>
                navigator.share?.({
                  title: post.title,
                  url: window.location.href,
                })
              }
            >
              <Share2 className="size-4" />
              Share
            </Button>
            <Button
              variant="outline"
              className="rounded-xl gap-2"
              onClick={handleLike}
              disabled={liking || !canInteract}
            >
              {liking ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Heart className="size-4" />
              )}
              {likeCount} {likeCount === 1 ? "Like" : "Likes"}
            </Button>
          </div>

          {slug && (
            <PostCommentsSection slug={slug} allowInteraction={canInteract} />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PostDetail;
