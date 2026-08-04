"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageCircle, Reply } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  useGetPostCommentsQuery,
  useCreatePostCommentMutation,
  type PostComment,
} from "@/redux/features/posts/postsApi";
import { extractErrorMessage } from "@/lib/apiError";

interface PostCommentsSectionProps {
  slug: string;
  allowInteraction?: boolean;
}

function CommentItem({
  comment,
  slug,
  allowInteraction,
  depth = 0,
}: {
  comment: PostComment;
  slug: string;
  allowInteraction: boolean;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [createComment, { isLoading: submitting }] =
    useCreatePostCommentMutation();

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await createComment({
        id: slug,
        content: replyText.trim(),
        parentId: comment.id,
      }).unwrap();
      setReplyText("");
      setReplying(false);
      toast.success("Reply posted");
    } catch (err: unknown) {
      const message = extractErrorMessage(err, "Failed to post reply");
      if (
        message.toLowerCase().includes("token") ||
        message.toLowerCase().includes("unauthorized")
      ) {
        toast.info("Please log in to reply");
      } else {
        toast.error(message);
      }
    }
  };

  return (
    <div className={depth > 0 ? "ml-6 border-l-2 border-border/30 pl-4" : ""}>
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border/30">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-black uppercase">
            {comment.donor?.fullName ?? "Donor"}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{comment.content}</p>
        {allowInteraction && depth === 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-8 px-2 text-[10px] font-black uppercase "
            onClick={() => setReplying((v) => !v)}
          >
            <Reply className="size-3 mr-1" />
            Reply
          </Button>
        )}
        {replying && (
          <div className="flex gap-2 mt-3">
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="rounded-xl h-10 text-sm"
            />
            <Button
              className="rounded-xl h-10"
              onClick={handleReply}
              disabled={submitting || !replyText.trim()}
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Reply"
              )}
            </Button>
          </div>
        )}
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              slug={slug}
              allowInteraction={allowInteraction}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PostCommentsSection({
  slug,
  allowInteraction = true,
}: PostCommentsSectionProps) {
  const [comment, setComment] = useState("");
  const { data: commentsData, isLoading } = useGetPostCommentsQuery(slug, {
    skip: !slug || !allowInteraction,
  });
  const [createComment, { isLoading: commenting }] =
    useCreatePostCommentMutation();

  const comments = commentsData?.data ?? [];
  const totalCount = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length ?? 0),
    0,
  );

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      await createComment({ id: slug, content: comment.trim() }).unwrap();
      setComment("");
      toast.success("Comment posted");
    } catch (err: unknown) {
      const message = extractErrorMessage(err, "Failed to post comment");
      if (
        message.toLowerCase().includes("token") ||
        message.toLowerCase().includes("unauthorized")
      ) {
        toast.info("Please log in to comment");
      } else {
        toast.error(message);
      }
    }
  };

  return (
    <section className="border-t border-border/40 pt-8 space-y-4">
      <h2 className="text-sm font-black uppercase  flex items-center gap-2">
        <MessageCircle className="size-4" />
        Comments ({allowInteraction ? totalCount : 0})
      </h2>

      {!allowInteraction && (
        <p className="text-sm text-muted-foreground">
          Comments will be available once this post is published.
        </p>
      )}

      {allowInteraction && (
        <div className="flex gap-2">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment..."
            className="rounded-xl h-12"
          />
          <Button
            className="rounded-xl"
            onClick={handleComment}
            disabled={commenting || !comment.trim()}
          >
            {commenting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Post"
            )}
          </Button>
        </div>
      )}

      {allowInteraction && isLoading && (
        <p className="text-sm text-muted-foreground">Loading comments...</p>
      )}

      {allowInteraction && (
        <div className="space-y-4">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              slug={slug}
              allowInteraction={allowInteraction}
            />
          ))}
          {!isLoading && comments.length === 0 && (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}
        </div>
      )}
    </section>
  );
}
