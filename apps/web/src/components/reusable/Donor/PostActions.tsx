"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  EllipsisVertical,
  PencilIcon,
  TrashIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PostDialog } from "./PostDialog";
import type { LegacyPost } from "@/lib/post";
import {
  useUpdatePostApprovalMutation,
  useDeletePostMutation,
} from "@/redux/features/posts/postsApi";
import { toast } from "sonner";

interface PostActionsProps {
  post: LegacyPost;
  showModeration?: boolean;
}

export function PostActions({
  post,
  showModeration = false,
}: PostActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [updateApproval] = useUpdatePostApprovalMutation();
  const [deletePost] = useDeletePostMutation();

  const handleDelete = async () => {
    try {
      await deletePost(post.id).unwrap();
      toast.success("Post deleted successfully.");
    } catch {
      toast.error("Failed to delete post.");
    }
  };

  const handleApprove = async () => {
    try {
      await updateApproval({
        id: post.id,
        approvalStatus: "APPROVED",
      }).unwrap();
      toast.success("Post approved successfully");
    } catch {
      toast.error("Failed to approve post");
    }
  };

  const handleReject = async () => {
    try {
      await updateApproval({
        id: post.id,
        approvalStatus: "REJECTED",
      }).unwrap();
      toast.error("Post rejected");
    } catch {
      toast.error("Failed to reject post");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="rounded-full size-8"
            variant={"ghost"}
            size={"icon"}
          >
            <EllipsisVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="rounded-2xl border-border/40 p-2 min-w-[160px]"
        >
          {showModeration && post.status === "Pending" && (
            <DropdownMenuGroup className="border-b border-border/20 mb-1 pb-1">
              <DropdownMenuItem
                onClick={handleApprove}
                className="rounded-xl px-3 py-2 cursor-pointer focus:bg-emerald-500/5 focus:text-emerald-500 transition-colors"
              >
                <CheckCircle2 className="size-4 mr-2" />
                <span className="text-xs font-bold">Approve</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleReject}
                className="rounded-xl px-3 py-2 cursor-pointer focus:bg-red-500/5 focus:text-red-500 transition-colors mt-1"
              >
                <XCircle className="size-4 mr-2" />
                <span className="text-xs font-bold">Reject</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          )}
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => setIsEditDialogOpen(true)}
              className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors"
            >
              <PencilIcon className="size-4 mr-2 hover:text-primary" />
              <span className="text-xs font-bold ">Edit</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => setIsDeleteDialogOpen(true)}
              variant="destructive"
              className="rounded-xl px-3 py-2 cursor-pointer focus:bg-red-500/5 focus:text-red-500 transition-colors mt-1"
            >
              <TrashIcon className="size-4 mr-2" />
              <span className="text-xs font-bold ">Delete</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <PostDialog
        post={post}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="rounded-[2.5rem] border-border/40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter ">
              Delete Post?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-muted-foreground  leading-relaxed">
              Are you sure you want to delete this post? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-12 rounded-2xl border-border/40 font-bold text-xs uppercase  px-6">
              Keep Post
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="h-12 rounded-2xl bg-red-500 text-white hover:bg-red-600 font-bold text-xs uppercase  px-6 border-none"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
